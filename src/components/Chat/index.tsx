import { $, component$, useSignal, useStore } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
// import { PromptTemplate } from "langchain";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { HuggingFaceInference } from "langchain/llms/hf";
import { HUGGINGFACEHUB_API_KEY } from "~/constants";

// Open source model from HuggingFace
const model = new HuggingFaceInference({
  // model: "declare-lab/flan-alpaca-large",
  model: "google/flan-t5-xxl",
  temperature: 0.1,
  maxTokens: 64,
  apiKey: HUGGINGFACEHUB_API_KEY,
});

// Chain to load the model and the documents
const chain = loadQAStuffChain(model);

// Documents to use for the chat
const docs = [
  new Document({
    pageContent:
      "Hello my name is Flan Alpaca. I like to play football. My favourtie meal is spaghetti. My age is 31 years old. My cat's name is Lilith and she is black",
  }),
];

/**
 * Chat component to interact directly with the model
 */
export const Chat = component$(() => {
  const responses = useStore<Array<string>>(["Ask me something!"]);
  const input = useSignal<string>("");
  // TODO: Implement chat component
  // 1. Importar y procesar archivos txt
  // 2. Con un embedding de HuggingFace Vectorizar archivos txt
  // 3. Crear base de datos vectorial

  const getModelResponse = $(async () => {
    if (input.value === "") return;
    responses.push(input.value);
    const res = await model.call(input.value);
    responses.push(res);
    input.value = "";
  });

  return (
    <div class="chat">
      <div class="chat__history">
        {responses.length > 0 &&
          responses.map((response, i) => (
            <div
              class={`chat__block ${i % 2 === 0 ? "ia" : "user"}`}
              key={i + 1}
            >
              <p>{response}</p>
            </div>
          ))}
      </div>
      <div class="chat__input">
        <Form>
          <input
            value={input.value}
            type="text"
            onInput$={(ev, el) => (input.value = el.value)}
          />
          <button onClick$={getModelResponse}>Ask</button>
        </Form>
      </div>
    </div>
  );
});

/**
 * Chat component to interact with de documentation provided
 */
export const ChatWithDocs = component$(() => {
  const responses = useStore<Array<string>>(["Ask me something!"]);
  const input = useSignal<string>("");
  const loading = useSignal<boolean>(false);

  /**
   * Async function that gets the response from the chain, using the input value and the docs provided to generate the response
   */
  const getChainResponse = $(async () => {
    if (input.value === "") return;

    responses.push(input.value);
    loading.value = true;

    const { text } = await chain.call({
      input_documents: docs,
      question: input.value,
    });

    loading.value = false;
    responses.push(text);
    input.value = "";
  });

  return (
    <div class="chat">
      <div class="chat__history">
        {responses.length > 0 &&
          responses.map((response, i) => (
            <div
              class={`chat__block ${i % 2 === 0 ? "ia" : "user"}`}
              key={i + 1}
            >
              <p>{response}</p>
            </div>
          ))}
        {loading.value && (
          <div class="chat__block ia loading">
            <p>Thinking...</p>
          </div>
        )}
      </div>
      <div class="chat__input">
        <Form>
          <input
            value={input.value}
            type="text"
            onInput$={(ev, el) => (input.value = el.value)}
          />
          <button disabled={!input.value} onClick$={getChainResponse}>
            Ask
          </button>
        </Form>
      </div>
    </div>
  );
});
