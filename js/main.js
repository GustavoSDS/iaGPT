import { CreateWebWorkerMLCEngine } from "https://esm.run/@mlc-ai/web-llm";


const $ = (selector) => document.querySelector(selector); // Selector function to get elements

const $form = $('form');
const $input = $('input');
const $template = $('#message-template');
const $messages = $('ul');
const $container = $('main');
const $button = $('button');
const $info = $('small');

let messages = [];

// Modelo seleccionado para el chat
const SELECTED_MODEL = "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k";
const engine = await CreateWebWorkerMLCEngine(
    new Worker('./js/worker.js', {type: 'module'}),
    SELECTED_MODEL,
    {
        initProgressCallback: (info) => {
            $info.textContent = `${info.text}`;
            if (info.progress === 1) {
                $info.textContent = '';
                $button.removeAttribute('disabled');
            }
        },
    });


$form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const messageText = $input.value.trim();

    if (messageText.length > 0) {
        addMessage(messageText, 'user');
        $input.value = '';
    }
    $button.disabled = true;
    $button.textContent = 'Thinking...';

    const userMessage = {
        role: 'user',
        content: messageText,
    }
    messages.push(userMessage);

    const chunks = await engine.chat.completions.create({
        messages: messages,
        stream: true,
    });

    let reply = '';
    const $botMessage = addMessage('...', 'bot');

    for await (const chunk of chunks) {
        const [choice] = chunk.choices;
        const content = choice.delta.content ?? '';
        reply += content;

        $botMessage.textContent = reply;
        $container.scrollTop = $container.scrollHeight;
        $button.textContent = 'Thinking...';
        $button.disabled = true;
    }
    messages.push({
        role: 'assistant',
        content: reply,
    });

});

function addMessage(messageText, who) {
    const messageElement = $template.content.cloneNode(true); // clonación del template	(con true para clonación de profunda)

    const $newMessage = messageElement.querySelector('.message');

    const $who = $newMessage.querySelector('label');
    const $text = $newMessage.querySelector('p');

    $text.textContent = messageText;
    $who.textContent = who === 'bot' ? 'GPT' : 'Tú';
    $newMessage.classList.add(who);

    $messages.appendChild(messageElement);
    $container.scrollTop = $container.scrollHeight;

    return $text;
}