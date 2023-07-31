import { $, component$, useSignal, useStore } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
// import { PromptTemplate } from "langchain";
import { loadQAStuffChain } from "langchain/chains";
import { Document } from "langchain/document";
import { HuggingFaceInference } from "langchain/llms/hf";
import { CheerioWebBaseLoader } from "langchain/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { HuggingFaceInferenceEmbeddings } from "langchain/embeddings/hf";
import { HUGGINGFACEHUB_API_KEY } from "~/constants";

/**
 * Open source model from HuggingFace
 */
const model = new HuggingFaceInference({
  // model: "declare-lab/flan-alpaca-large",
  model: "google/flan-t5-xxl",
  temperature: 0.1,
  maxTokens: 64,
  apiKey: HUGGINGFACEHUB_API_KEY,
});

/**
 * Chain to load the model and the documents
 */
const chain = loadQAStuffChain(model);

/**
 * Documents to use for the chat
 */
const docs = [
  new Document({
    pageContent:
      "Hello my name is Flan Alpaca. I like to play football. My favourtie meal is spaghetti. My age is 31 years old. My cat's name is Lilith and she is black",
  }),
];

/**
 * Loader to get the docs directly from the web
 */
const loader = new CheerioWebBaseLoader(
  "https://lilianweng.githu.io/posts/2023-06-23-agent/"
);

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500,
  chunkOverlap: 0,
});

const embeddings = new HuggingFaceInferenceEmbeddings({
  apiKey: HUGGINGFACEHUB_API_KEY, // In Node.js defaults to process.env.HUGGINGFACEHUB_API_KEY
});

/**
 * Basic Chat component to interact directly with the model
 */
export const Chat = component$(() => {
  const responses = useStore<Array<string>>(["Ask me anything!"]);
  const input = useSignal<string>("");

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
 * Chat component to interact with de documentation provided. Basic Q&A. For larger data use Embeddings https://js.langchain.com/docs/use_cases/question_answering/
 */
export const ChatWithDocs = component$(() => {
  const responses = useStore<Array<{ text: string; class: string }>>([
    { class: "ia", text: "Ask me something about your docs!" },
  ]);
  const input = useSignal<string>("");
  const loading = useSignal<boolean>(false);

  /**
   * Async function that gets the response from the chain, using the input value and the docs provided to generate the response
   */
  const getChainResponse = $(async () => {
    if (input.value === "") return;

    responses.push({ text: input.value, class: "user" });
    loading.value = true;

    const { text } = await chain.call({
      input_documents: docs,
      question: input.value,
    });

    loading.value = false;
    responses.push({ text, class: "ia" });
    input.value = "";
  });

  return (
    <div class="chat">
      <div class="chat__history">
        {responses.length > 0 &&
          responses.map((response, i) => (
            <div key={i + 1} class={`chat__block ${response.class}`}>
              <p>{response.text}</p>
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
            onInput$={(event, el) => (input.value = el.value)}
          />
          <button disabled={!input.value} onClick$={getChainResponse}>
            Ask
          </button>
        </Form>
      </div>
    </div>
  );
});

export const ChatWithEmbeddings = component$(() => {
  const responses = useStore<Array<{ text: string; class: string }>>([
    { class: "ia", text: "Ask me something about your docs!" },
  ]);
  const input = useSignal<string>("");
  const loading = useSignal<boolean>(false);

  // 1. Prepare the docs
  /**
   * Async function: 1 - loads the docs from the web. 2- splits them. 3- stores them in the vectorStore
   */
  const prepareDocs = $(async () => {
    console.log("Preparing Docs");
    // Load from the web
    const docs = await loader.load();
    console.log("got docs from loader");
    // Pass the information obtained to the splitter in array of strings
    const chunks = await textSplitter.splitDocuments(docs);
    console.log("got chunks from splitter");
    // Store the chunks in the vectorStore
    const vectorStore = await MemoryVectorStore.fromDocuments(
      chunks,
      embeddings
    );
    console.log("got vector store");
    return vectorStore;
  });

  // 2. Retrieve the data
  /**
   * Async function that gets the response from the chain, using the input value and the docs provided to generate the response
   */
  const getChainResponse = $(async () => {
    if (input.value === "") return;

    // Get the vectorStore
    responses.push({ text: input.value, class: "user" });
    loading.value = true;

    const vectorStore = await prepareDocs();
    const relevantDocs = await vectorStore.similaritySearch(input.value, 2);
    console.log(relevantDocs.length, "got relevant docs... doing chain call");

    const { text } = await chain.call({
      input_documents: relevantDocs,
      question: input.value,
    });
    console.log("got chain response");
    loading.value = false;
    responses.push({ text, class: "ia" });
    input.value = "";
  });

  return (
    <div class="chat">
      <div class="chat__history">
        {responses.length > 0 &&
          responses.map((response, i) => (
            <div key={i + 1} class={`chat__block ${response.class}`}>
              <p>{response.text}</p>
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
            onInput$={(event, el) => (input.value = el.value)}
          />
          <button disabled={!input.value} onClick$={getChainResponse}>
            Ask
          </button>
        </Form>
      </div>
    </div>
  );
});
