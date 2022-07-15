import { Api, VERSION as telegramVersion } from "$grm";
import { bigInt } from "$grm/deps.ts";
import { CommandHandler, Module, version } from "$xor";
import { pre, whois } from "./helpers.ts";

const LOAD_TIME = Date.now();

const util: Module = {
  name: "util",
  handlers: [
    new CommandHandler("ping", async ({ client, event }) => {
      const before = Date.now();
      await client.invoke(new Api.Ping({ pingId: bigInt(0) }));
      const diff = Date.now() - before;
      await event.message.edit({
        text: event.message.text + " " + diff + "ms",
      });
    }),
    new CommandHandler(
      "shell",
      async ({ event, args, input }) => {
        if (args.length < 1) {
          return;
        }
        args = args.slice(1);
        let { text } = event.message;
        text = text.slice(text.split(/\s/)[0].length);
        const proc = Deno.run({
          cmd: text.trim().split(/\s/),
          stdout: "piped",
          stderr: "piped",
          stdin: input.length == 0 ? undefined : "piped",
        });
        text = `[${proc.pid}]${text}`;
        await event.message.edit({ text });
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        if (input.length != 0) {
          proc.stdin?.write(encoder.encode(input));
          proc.stdin?.close();
        }
        const stdout = decoder.decode(await proc.output());
        const stderr = decoder.decode(await proc.stderrOutput());
        if (stdout.length > 0 && stdout.length <= 4096) {
          await event.message.reply({
            message: pre(stdout),
            parseMode: "html",
          });
        }
        if (stderr.length > 0 && stderr.length <= 4096) {
          await event.message.reply({
            message: pre(stderr),
            parseMode: "html",
          });
        }
        const { code } = await proc.status();
        text += "\n" + `Exited with code ${code}.`;
        await event.message.edit({ text });
      },
      {
        aliases: ["sh", "cmd", "exec"],
      },
    ),
    new CommandHandler("uptime", async ({ event }) => {
      let seconds = Math.floor(
        (Date.now() - LOAD_TIME) / 1000,
      );
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds - hours * 3600) / 60);
      seconds = seconds - hours * 3600 - minutes * 60;
      await event.message.edit({
        text: event.message.text +
          " " +
          (hours > 0 ? `${hours > 9 ? hours : "0" + hours}:` : "") +
          `${minutes > 9 ? minutes : "0" + minutes}:` +
          `${seconds > 9 ? seconds : "0" + seconds}`,
      });
    }),
    new CommandHandler(
      "version",
      async ({ event }) => {
        await event.message.edit({
          text: event.message.text +
            "\n" +
            "Deno " +
            Deno.version.deno +
            "\n" +
            "Grm " +
            "\n" +
            "Xor " +
            version +
            telegramVersion,
        });
      },
      { aliases: ["v"] },
    ),
    new CommandHandler("whois", async ({ client, event, args }) => {
      let info = "";
      if (args[0] !== undefined && args[0].length != 0) {
        const entity = await client.getEntity(args[0]);
        info += (await whois(entity, client)).trim() + "\n\n";
      }
      const chat = await event.message.getChat();
      if (chat) {
        info += "<b>Here</b>" + "\n";
        info += (await whois(chat, client)).trim() + "\n\n";
      }
      const reply = await event.message.getReplyMessage();
      if (reply) {
        const sender = await reply.getSender();
        if (sender) {
          info += "<b>Reply</b>" + "\n";
          info += (await whois(sender, client)).trim() + "\n\n";
        }
        if (reply.forward) {
          const sender = await reply.forward.getSender();
          if (sender) {
            info += "<b>Forwarder</b>" + "\n";
            info += (await whois(sender, client)).trim() + "\n\n";
          }
        }
      }
      if (info.length == 0) {
        return;
      }
      await event.message.edit({
        text: event.message.text + "\n\n" + info,
        parseMode: "html",
      });
    }),
    // new CommandHandler("eval", async ({ client, event, input }) => {
    //   const message = event.message;
    //   const reply = await event.message.getReplyMessage();
    //   const vm = new NodeVM({
    //     sandbox: {
    //       client,
    //       c: client,
    //       event,
    //       e: event,
    //       message,
    //       m: message,
    //       reply,
    //       r: reply,
    //       Api,
    //       methods: new Methods(client),
    //     },
    //   });
    //   let result = JSON.stringify(
    //     await vm.run(`module.exports = (async () => {\n${input}\n})()`),
    //     null,
    //     2,
    //   );
    //   if (!result) {
    //     await event.message.reply({
    //       message: "No output.",
    //     });
    //     return;
    //   }
    //   if (result.startsWith('"')) {
    //     result = result.replace(/"/g, "");
    //   }
    //   if (result.length <= 4096) {
    //     await event.message.reply({
    //       message: result,
    //       parseMode: undefined,
    //       formattingEntities: [
    //         new Api.MessageEntityPre({
    //           offset: 0,
    //           length: result.length,
    //           language: "",
    //         }),
    //       ],
    //     });
    //   } else {
    //     const buffer = Buffer.from(result);
    //     await event.message.reply({
    //       file: new CustomFile("result.txt", buffer.length, "", buffer),
    //     });
    //   }
    // }),
  ],
  help: `
**Introduction**

The util module includes some useful commands to interact with the system and get basic information of the surrounding.

**Commands**

- ping

Tells how much a ping of Telegram servers takes.

- shell, sh, cmd, exec

Runs a shell command and sends its output. Any input will be passed to the stdin of the process.

- uptime

Displays the uptime of the bot in (hh:)mm:ss format.

- version, v

Displays the versions of Xor, GramJS and Node.

- whois

Fetches and displays basic information about the current chat, the provided identifier as the first argument and/or the replied message. The provided identifier can be a username, a phone number, a user/chat ID or a chat invite ID.

- eval

Runs and sends the output of JavaScript code. As of now, it passes the GramJS client as \`client | c\`, the \`NewMessageEvent\` as \`event | e\`, the message as \`message | m\`, the replied message as \`reply | r\`, xorgram-methods instance as \`methods\` and the GramJS API namespace as \`Api\`.

`,
};

export default util;
