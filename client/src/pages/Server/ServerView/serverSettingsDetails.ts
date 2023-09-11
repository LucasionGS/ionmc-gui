import { ServerProperties } from "@shared/models";

// Type, Name, Description, Category
export const serverSettingsDetails: Record<keyof ServerProperties, ["number" | "string" | "boolean" | string[], string, string, string?]> = {
  "motd": [
    "string",
    "Message of the Day",
    "The message of the day displayed in the server list.",
    "Essentials"
  ],
  "max-players": [
    "number",
    "Max Players",
    "The maximum number of players allowed on the server.",
    "Essentials"
  ],
  "level-name": [
    "string",
    "Level Name",
    "The name of the world to be saved on disk. Recommended to be left at world or prefixed with a folder path like worlds/my-world for multiworld servers.",
    "Essentials"
  ],
  "spawn-protection": [
    "number",
    "Spawn Protection Distance",
    "Distance in blocks from the world spawn point within which players cannot damage blocks or interact with the world.",
    "World"
  ],
  "max-tick-time": [
    "number",
    "Max Tick Time",
    "The maximum number of milliseconds a single tick may take before the server watchdog stops the server with the message, A single server tick took 60.00 seconds (should be max 0.05); Considering it to be crashed, server will forcibly shutdown. Once this criteria is met, it calls System.exit(1). Setting this to -1 will disable watchdog entirely.",
    "Performance"
  ],
  "online-mode": [
    "boolean",
    "Online Mode",
    "Whether to enable online mode. If set to true, all connected players must have a logged in Minecraft account.",
    "Security"
  ],
  "prevent-proxy-connections": [
    "boolean",
    "Prevent Proxy Connections",
    "Whether to prevent proxy connections. If set to true, players connecting through a proxy will be kicked.",
    "Security"
  ],
  "rate-limit": [
    "number",
    "Rate Limit",
    "The maximum number of packets that can be sent to the server per second.",
    "Performance"
  ],
  "enable-rcon": [
    "boolean",
    "RCON",
    "Whether to enable the RCON protocol for remote console access to the server.",
    "RCON"
  ],
  "rcon.port": [
    "number",
    "RCON Port",
    "The port that the RCON protocol will listen on.",
    "RCON"
  ],
  "rcon.password": [
    "string",
    "RCON Password",
    "The password required to use the RCON protocol.",
    "RCON"
  ],
  "broadcast-rcon-to-ops": [
    "boolean",
    "Broadcast RCON to Ops",
    "Whether to broadcast RCON messages to server operators.",
    "RCON"
  ],
  "enable-jmx-monitoring": [
    "boolean",
    "Enable JMX Monitoring",
    "Whether to enable JMX monitoring. This allows access to MBeans by remote clients.",
    "Advanced"
  ],
  "sync-chunk-writes": [
    "boolean",
    "Sync Chunk Writes",
    "Whether to sync chunk writes to disk. Disabling this may improve performance but increases the risk of data corruption in the event of a power loss or crash.",
    "Advanced"
  ],
  "enable-command-block": [
    "boolean",
    "Enable Command Block",
    "Whether to enable command blocks. If set to false, command blocks will not work in the world.",
    "Advanced"
  ],
  "function-permission-level": [
    "number",
    "Function Permission Level",
    "The permission level required to use functions. 2 - Operators only, 3 - Anyone.",
    "Advanced"
  ],
  "max-build-height": [
    "number",
    "Max Build Height",
    "The maximum height that players can build up to.",
    "World"
  ],
  "spawn-npcs": [
    "boolean",
    "Spawn NPCs",
    "Whether to allow NPCs to spawn. This includes villagers and other entities that use NPC AI.",
    "World"
  ],
  "spawn-animals": [
    "boolean",
    "Spawn Animals",
    "Whether to allow animals to spawn. This includes cows, pigs, sheep, etc.",
    "World"
  ],
  "spawn-monsters": [
    "boolean",
    "Spawn Monsters",
    "Whether to allow hostile monsters to spawn. This includes zombies, skeletons, etc.",
    "World"
  ],
  "view-distance": [
    "number",
    "View Distance",
    "The maximum distance that players can see.",
    "Performance"
  ],
  "entity-broadcast-range-percentage": [
    "number",
    "Entity Broadcast Range Percentage",
    "The percentage of the server's view distance that entities are broadcast to clients.",
    "Performance"
  ],
  "max-world-size": [
    "number",
    "Max World Size",
    "The maximum size of the world in blocks.",
    "World"
  ],
  "allow-nether": [
    "boolean",
    "Allow Nether",
    "Whether to allow players to enter the Nether. If set to false, players will be unable to enter the Nether portal.",
    "World"
  ],
  "level-type": [
    "string",
    "Level Type",
    "The type of the world.",
    "World"
  ],
  "generator-settings": [
    "string",
    "Generator Settings",
    "The generator settings for the world. Used for customized worlds.",
    "World"
  ],
  "level-seed": [
    "string",
    "Level Seed",
    "The seed used to generate the world. Leave blank to generate a random seed. It only affects worlds created after setting the value.",
    "World"
  ],
  "hardcore": [
    "boolean",
    "Hardcore",
    "Whether to enable hardcore mode. If set to true, players will be permanently banned from the server if they die.",
    "Difficulty"
  ],
  "pvp": [
    "boolean",
    "PvP",
    "Whether to enable PvP. If set to false, players will be unable to attack other players.",
    "Essentials"
  ],
  "allow-flight": [
    "boolean",
    "Allow Flight",
    "Whether to allow players to fly. If set to true, players will be able to fly in survival mode if they have a mod that provides flight installed.",
    "Security"
  ],
  "gamemode": [
    "string",
    "Default Gamemode",
    "The default game mode for new players. Gamemodes: survival, creative, adventure, spectator.",
    "Difficulty"
  ],
  "force-gamemode": [
    "boolean",
    "Force Gamemode",
    "Whether to force players to join in the default game mode.",
    "Difficulty"
  ],
  "difficulty": [
    [
      "peaceful",
      "easy",
      "normal",
      "hard"
    ],
    "Difficulty",
    "The difficulty level of the game. Difficulties: peaceful, easy, normal, hard.",
    "Essentials"
  ],
  "player-idle-timeout": [
    "number",
    "Player Idle Timeout",
    "The number of minutes a player can be idle before they are kicked from the server.",
    "Security"
  ],
  "white-list": [
    "boolean",
    "White List",
    "Whether to enable the server whitelist. If set to true, players must be added to the whitelist before they can join the server.",
    "Security"
  ],
  "enforce-whitelist": [
    "boolean",
    "Enforce Whitelist",
    "Whether to enforce the server whitelist.",
    "Security"
  ],
  "broadcast-console-to-ops": [
    "boolean",
    "Broadcast Console to Ops",
    "Whether to broadcast console messages to server operators.",
    "Security"
  ],
  "text-filtering-config": [
    "string",
    "Text Filtering Config",
    "The path to the text filtering configuration file.",
    "Security"
  ],
  "enable-query": [
    "boolean",
    "Enable Query",
    "Whether to enable the query protocol. This allows clients to retrieve information about the server.",
    "Query"
  ],
  "query.port": [
    "number",
    "Query Port",
    "The port that the server will listen on for incoming connections. This setting is required for the current server list ping protocol.",
    "Query"
  ],
  "server-ip": [
    "string",
    "Server IP",
    "The IP address that the server will bind to. This should be left blank",
    "Network"
  ],
  "server-port": [
    "number",
    "Server Port",
    "The port that the server will listen on for incoming connections. This can only be between 25000-35000 and must be different from the other servers on this host.",
    "Network"
  ],
  "resource-pack": [
    "string",
    "Resource Pack",
    "The URL to the server's resource pack.",
    "Resource Pack"
  ],
  "resource-pack-sha1": [
    "string",
    "Resource Pack SHA-1",
    "The SHA-1 hash of the server's resource pack.",
    "Resource Pack"
  ],
  "snooper-enabled": [
    "boolean",
    "Snooper Enabled",
    "Whether to enable the snooper. If set to true, the server will send data to Mojang.",
    "Advanced"
  ],
  "enable-status": [
    "boolean",
    "Enable Status",
    "Whether to enable the server status protocol.",
    "Network"
  ],
  "generate-structures": [
    "boolean",
    "Generate Structures",
    "Whether to generate structures. If set to false, villages, strongholds, etc. will not be generated.",
    "World"
  ],
  "network-compression-threshold": [
    "number",
    "Network Compression Threshold",
    "The threshold at which packets will be compressed.",
    "Network"
  ],
  "op-permission-level": [
    "number",
    "OP Permission Level",
    "The permission level required to use operator commands.",
    "Security"
  ],
  "use-native-transport": [
    "boolean",
    "Use Native Transport",
    "Whether to use native transport.",
    "Network"
  ],
};
