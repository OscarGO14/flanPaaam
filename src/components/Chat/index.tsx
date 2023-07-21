import { $, component$, useSignal, useStore, useTask$ } from "@builder.io/qwik";
import { Form } from "@builder.io/qwik-city";
// import { PromptTemplate } from "langchain";
// import { LLMChain } from "langchain/chains";
import { HuggingFaceInference } from "langchain/llms/hf";
import { HUGGINGFACEHUB_API_KEY } from "~/constants";

const model = new HuggingFaceInference({
  // model: "declare-lab/flan-alpaca-large",
  model: "google/flan-t5-xxl",
  temperature: 0.1,
  maxTokens: 64,
  apiKey: HUGGINGFACEHUB_API_KEY,
});

export const Chat = component$(() => {
  // Create state for response
  const responses = useStore<Array<string>>([]);
  const input = useSignal<string>("");
  // TODO: Implement chat component
  // 1. Importar y procesar archivos txt
  // 2. Con un embedding de HuggingFace Vectorizar archivos txt
  // 3. Crear base de datos vectorial
  // 4. Crear logica de promt para generar respuestas

  const getModelResponse = $(async () => {
    const res = await model.call(input.value);
    responses.push(`${input.value} ? ${res}`);
  });

  useTask$(({ track }) => {
    const newResponses = track(() => responses);
    console.log({ newResponses });
    input.value = "";
  });

  return (
    <div class="chat">
      <h2>CHAT</h2>

      <Form>
        <input type="text" onChange$={(e) => (input.value = e.target.value)} />
        <button onClick$={getModelResponse}>Ask Flan</button>
      </Form>
      {responses.length > 0 &&
        responses.map((response, i) => (
          <p key={i + 1}>
            {i + 1}. {response}
          </p>
        ))}
    </div>
  );
});
