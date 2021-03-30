import "./env";
import * as Nertivia from "nertivia.js";
import Message from "nertivia.js/dist/Message";
import * as DB from "./database";
import { formatDuration } from "./utils";
import { Leaderboard, Profile } from "./components";

const config = {
  prefix: process.env.PREFIX ?? "!",
  token: process.env.TOKEN!,
  // env is read as a string for every value :/
  dev: process.env.DEV === "true"
};

export const levelXp = (level: number) => (level * level) * 100;

export const xpAsLevels = (xp: number) => {
  const level = Math.floor(Math.sqrt(xp / 100));
  return { level: level + 1, xp: xp - levelXp(level) };
};

export const xpUntilNextLevel = (xp: number) => {
  const level = xpAsLevels(xp).level + 1;
  return levelXp(level) - xp;
};

const XP_TIMEOUT = 60_000;
const REP_TIMEOUT = 600_000;

async function updateXP(msg: Message) {
  const user = await DB.getUser(msg.author.id);

  if (user && (Date.now() - user.lastXPDate) > XP_TIMEOUT) {
    const before = xpAsLevels(user.xp);
    const xpAmount = Math.floor((Math.random() * 60) + 1);
    const added = await DB.addXp(msg.author.id, xpAmount);
    const after = xpAsLevels(user.xp + added);

    if (after.level > before.level) {
      msg.send(
        `${msg.author}, You have leveled up to level ${after.level}. To see your profile, use the ${config.prefix}profile command.`,
      );
    }
  }

  return user;
}

type Commands = Record<
  string,
  (msg: Message, args: string[]) => Promise<unknown>
>;

const setCommands: Commands = {
  async bg(msg, [type, val]) {
    if (type === "none") {
      await DB.unsetBackground(msg.author.id);
      await msg.reply(`Successfully reset your background to none`, {
        htmlEmbed: await Profile(msg.author),
      });
      return
    }
    if (val == null) {
      throw new Error(`No background was set.`);
    }
    if (type === "url" || type === "color") {
      await DB.setBackground(msg.author.id, type, val);
      msg.reply(`Successfully set your background to: \`\`${val}\`\``, {
        htmlEmbed: await Profile(msg.author),
      });
    } else {
      throw new Error(`Invalid background type: ${type}`);
    }
  },
};

const commands: Commands = {
  async timeLeft(msg) {
    const user = await DB.getUser(msg.author.id);
    const timeout = XP_TIMEOUT - (Date.now() - user.lastXPDate);
    await msg.reply(`Time left until more XP: ${timeout}`);
  },
  async leaderboard(msg) {
    const rankedUsers = await DB.rankedUsers(10);
    await msg.send("Leaderboard:", {
      htmlEmbed: await Leaderboard({ users: rankedUsers }),
    });
  },
  async set(msg, [cmd, ...args]) {
    if (cmd in setCommands) {
      await setCommands[cmd](msg, args);
    } else {
      throw new Error(`Invalid set command: ${cmd}`);
    }
  },
  async rep(msg) {
    const author = await DB.getUser(msg.author.id);
    const timePassed = Date.now() - author.lastRepDate;
    const repUser = msg.mentions.users.first();

    if (!repUser) {
      await msg.reply(`Usage: ${config.prefix}rep @username`);
      return;
    }

    if (repUser.id === author.id) {
      await msg.send("You cannot rep yourself.");
      return;
    }

    if (timePassed > REP_TIMEOUT) {
      const reps = await DB.addReps(repUser.id);

      await DB.Users().where("id", author.id).update({
        lastRepDate: Date.now(),
      });

      await msg.send(
        `${repUser}, you have been repped by ${msg.author}. You now have ${reps} rep points.`,
      );
    } else {
      await msg.reply(
        `You may rep again in ${formatDuration(REP_TIMEOUT - timePassed)}`,
      );
    }
  },
  async profile(msg) {
    const user = msg.mentions.users.first() ?? msg.author;

    return await msg.send(`${user.tag}'s profile:`, {
      htmlEmbed: await Profile(user),
    });
  },
  async debug(msg) {
    const user = msg.mentions.users.first() ?? msg.author;
    const dbUser = await DB.getUser(user.id);
    await msg.reply("```" + JSON.stringify(dbUser, null, 4) + "```");
  },
};

async function onMessage(msg: Message) {
  if (msg.author.bot) return;

  await updateXP(msg);

  if (msg.content?.startsWith(config.prefix)) {
    const text = msg.content.slice(config.prefix.length);
    const [cmd, ...args] = text.split(" ");
    if (cmd in commands) {
      commands[cmd](msg, args)
        .catch((err) =>
          msg.send("Error:\n```\n" + err.message + "\n```")?.catch(
            console.error,
          )
        );
    }
  }
}

const client = new Nertivia.Client();

client.on(
  "ready",
  async () => {
    console.log(
      `Successfully logged in as ` +
        `${client.user?.tag} to ${client.guilds.cache.size} server(s).`,
    );

    if(config.dev) {
      await client.user?.setStatus("ltp");
    }

    await client.user?.setActivity(`${config.prefix}profile`);
  },
);

client.on("message", onMessage);

client.login(config.token);

export { client };
