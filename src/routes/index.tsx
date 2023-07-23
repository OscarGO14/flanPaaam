import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Chat, ChatWithDocs } from "~/components/Chat";
import { Menu } from "~/components/Menu";

export default component$(() => {
  return (
    <>
      <header>
        <h1>🍮 Flan Paaam 🍮</h1>
      </header>
      {/* <Chat /> */}
      <ChatWithDocs />
      <Menu />
    </>
  );
});

export const head: DocumentHead = {
  title: "Flan Paaam Chat - Qwik",
  meta: [
    {
      name: "description",
      content:
        "Qwik site to develop a chat app with documentation ad model Flan-T5-XXL",
    },
  ],
};
