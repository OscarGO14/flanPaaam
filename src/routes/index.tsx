import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Chat } from "~/components/Chat";

export default component$(() => {
  return (
    <>
      <header>
        <h1>🍮Flan Alpaca Chat 🦙</h1>
      </header>
      <Chat />
    </>
  );
});

export const head: DocumentHead = {
  title: "Flan Alpaca Chat - Qwik",
  meta: [
    {
      name: "description",
      content: "Qwik site to develop a chat app with Flan Alpaca",
    },
  ],
};
