import { Knex, knex } from "knex";
import knexfile from "../knexfile";

export const db = knex(
  knexfile[process.env.DEV === "true" ? "development" : "production"],
);

export interface User {
  id: string;
  xp: number;
  reps: number;
  lastXPDate: number;
  lastRepDate: number;
  profileBackgroundType: "color" | "url" | null;
  profileBackground: string | null;
}

export type RankedUser = Pick<User, 'id' | 'xp'> & { rank: number };

export const Users = () => db<User>("users");

export const setDefaultUser = (id: string) =>
  Users()
    .insert({ id, xp: 0, reps: 0, lastXPDate: 0, lastRepDate: 0 })
    .onConflict("id")
    .ignore();

export const getUserRaw = (id: string) =>
  setDefaultUser(id).then(() => () => Users().where({ id }).first());

export const rankedUsers = (
  limit: number,
): Promise<RankedUser[]> =>
  db.raw(
    "SELECT id, xp, DENSE_RANK() OVER ( ORDER BY xp DESC ) rank FROM users LIMIT ?",
    [limit],
  );

export const getRank = (
  userID: string,
): Promise<(User & { rank: number }) | null> =>
  db.raw(
    "WITH ranks AS ( SELECT id, xp, DENSE_RANK() OVER ( ORDER BY xp DESC ) rank FROM users ) SELECT * FROM ranks WHERE id = ? LIMIT 1",
    [userID],
  ).then((r) => r[0]);

export const addXp = async (id: string, xpAmount: number) => {
  await Users()
    .where("id", id)
    .first()
    .increment("xp", xpAmount)
    .update({ lastXPDate: Date.now() });

  return xpAmount;
};

export const addReps = async (id: string, amount = 1) => {
  const User = await getUserRaw(id);
  await User().increment("reps", amount);
  return User().then((u) => u!.reps);
};

export const getUser = (id: string): Promise<User> =>
  getUserRaw(id).then((U) => U()) as Promise<User>;

export const setBackground = (
  id: string,
  type: User["profileBackgroundType"],
  value: string,
) =>
  Users()
    .where("id", id)
    .update({ profileBackgroundType: type, profileBackground: value });

export const unsetBackground = (id: string) =>
  Users().where("id", id).update({
    profileBackground: null,
    profileBackgroundType: null,
  });
