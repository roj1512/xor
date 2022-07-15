import { events } from "$grm";

export async function wrap(
  event: events.NewMessageEvent,
  func: () => Promise<void>,
) {
  try {
    await func();
  } catch (err) {
    console.error(err);
    try {
      let message = String(err);
      message = message.length <= 1000 ? message : "An error occurred.";
      await event.message.reply({ message });
    } catch (_err) {
      //
    }
  }
}

export async function updateMessage(
  event: events.NewMessageEvent,
  text: string,
  pm?: "md" | "markdown" | "html",
) {
  return await event.message.edit({
    text: event.message.text + "\n" + text,
    parseMode: pm,
  });
}