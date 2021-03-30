import { h } from './jsx'
import * as DB from './database'
import { User } from 'nertivia.js/dist/User'
import { client, levelXp, xpAsLevels, xpUntilNextLevel } from '.'

const backgroundStyle = (user: DB.User) => {
  switch (user.profileBackgroundType) {
    case "color":
      return { backgroundColor: user.profileBackground ?? undefined }
    case "url":
      return { backgroundImage: user.profileBackground ?? undefined, backgroundPosition: "center", backgroundSize: "cover" }
    default:
      return {}
  }
}

export const Leaderboard = async () => {
  const users = await DB.rankedUsers(10)

  return (
    <div style={{
      display: "flex",
      width: '100%',
      borderRadius: "4px",
      overflow: "hidden",
      ...backgroundStyle(users[0])
    }}>
      <div style={{
        display: "flex",
        flexDirection: 'column',
        justifyContent: "center",
        alignItems: 'center',
        alignContent: 'center',
        width: '100%',
        backgroundColor: "rgba(0,0,0,0.2)",
        backdropFilter: "blur(10px)",
        padding: "10px"
      }}>
        {
          users.map(dbUser => {
            const user = client.users.cache.get(dbUser.id)
            const levels = xpAsLevels(dbUser.xp)
            let string = `${dbUser.rank} - ${user?.username} - Level ${levels.level}`
            if (dbUser.rank === 1) string += ':crown:'
            return (
              <div style={{
                display: "flex",
                width: "70%",
                overflow: "hidden",
                borderRadius: "4px",
                marginBottom: "1px",
              }}>
                <div style={{
                  backgroundColor: "rgba(0,0,0,0.5)",
                  paddingLeft: "10px",
                  paddingTop: "10px",
                  paddingBottom: "10px",
                  width: "100%",
                  borderRadius: "4px",
                }}>{string}</div>
              </div>
            )
          })
        }
      </div>
    </div>
  )
}

export const Profile = async (user: User) => {
  const userRank = await DB.getRank(user.id)
  const levels = xpAsLevels(userRank?.xp ?? 0)
  const dbUser = await DB.getUser(user.id)

  return (
    <div style={{
      display: "flex",
      position: "relative",
      width: '400px',
      borderRadius: "4px",
      overflow: "hidden",
      ...backgroundStyle(dbUser)
    }}>
      <div style={{
        display: "flex",
        flexDirection: 'column',
        justifyContent: "center",
        alignItems: 'center',
        alignContent: 'center',
        width: '100%',
        backgroundColor: "rgba(0,0,0,0.4)",
      }}>
        <AvatarImage url={user.avatarURL} />
        <RoundedBubble text={`${dbUser?.reps} Reps`} />
        <strong style={{ marginTop: '5px' }}>{user.username}</strong>
        <BorderedBox text={`Level ${levels.level}`} />
        <ProgressBar max={levelXp(levels.level + 1)} val={levels.xp} />
        <div style={{
          position: "absolute",
          top: "1rem",
          right: "1rem"
        }}>{`#${userRank?.rank}`}</div>
      </div>
    </div>
  )
}

const AvatarImage = ({ url }: { url?: string }) =>
  <img style={{
    borderRadius: "50%",
    width: "80px",
    height: "80px",
    marginBottom: "10px",
    marginTop: "10px"
  }} src={url} />

const RoundedBubble = ({ text }: { text: string }) => {
  return (
    <div style={{
      marginTop: "-20px",
      backgroundColor: "var(--primary-color)",
      borderRadius: "10px",
      padding: "4px",
      fontSize: "14px",
    }}>{text}</div>
  )
}

const BorderedBox = ({ text }: { text: string }) => {
  return (
    <div style={{
      marginTop: "4px",
      border: "solid 1px var(--primary-color)",
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: "blur(8px)",
      borderRadius: "4px",
      padding: "4px",
      fontSize: "14px",
    }}>{text}</div>
  )
}

const ProgressBar = ({ max, val }: { max: number, val: number }) => {
  const percent = (val / max) * 100
  return (
    <div style={{
      backgroundColor: 'rgba(0,0,0,0.4)',
      backdropFilter: "blur(8px)",
      height: "20px",
      width: "140px",
      borderRadius: "4px",
      overflow: "hidden",
      marginTop: "10px",
      position: 'relative',
      marginBottom: "10px"
    }}>
      <div style={{
        display: "flex",
        position: 'absolute',
        left: "0",
        right: "0",
        justifyContent: "center",
        lineHeight: "1.4"
      }}>{`${val}/${max}`}</div>
      <div style={{
        backgroundColor: 'var(--primary-color)',
        height: "100%",
        width: `${percent}%`,
      }}></div>
    </div>
  )
}