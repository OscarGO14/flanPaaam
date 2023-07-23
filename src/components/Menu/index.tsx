import { component$ } from "@builder.io/qwik";

export const Menu = component$(() => {
  return (
    <aside class="menu closed">
      <ul>
        <li>Chat history 📚</li>
      </ul>
    </aside>
  );
});
