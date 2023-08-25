import { ServerProperties } from "@shared/models";

// Type, Name, Description, Category
export const serverSettingsDetails: Record<keyof ServerProperties, ["number" | "string" | "boolean" | string[], string, string, string?]> = {
  "motd": [
    "string",
    "MOTD",
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
    "The name of the world.",
    "Essentials"
  ],
  "spawn-protection": [
    "number",
    "Spawn Protection",
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
    "Whether to enable online mode.",
    "Security"
  ],
  "prevent-proxy-connections": [
    "boolean",
    "Prevent Proxy Connections",
    "Whether to prevent proxy connections.",
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
    "Enable RCON",
    "Whether to enable the RCON protocol.",
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
    "Whether to enable JMX monitoring.",
    "Advanced"
  ],
  "sync-chunk-writes": [
    "boolean",
    "Sync Chunk Writes",
    "Whether to sync chunk writes to disk.",
    "Advanced"
  ],
  "enable-command-block": [
    "boolean",
    "Enable Command Block",
    "Whether to enable command blocks.",
    "Advanced"
  ],
  "function-permission-level": [
    "number",
    "Function Permission Level",
    "The permission level required to use functions.",
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
    "Whether to allow NPCs to spawn.",
    "World"
  ],
  "spawn-animals": [
    "boolean",
    "Spawn Animals",
    "Whether to allow animals to spawn.",
    "World"
  ],
  "spawn-monsters": [
    "boolean",
    "Spawn Monsters",
    "Whether to allow monsters to spawn.",
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
    "Whether to allow players to enter the Nether.",
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
    "The generator settings for the world.",
    "World"
  ],
  "level-seed": [
    "string",
    "Level Seed",
    "The seed used to generate the world.",
    "World"
  ],
  "hardcore": [
    "boolean",
    "Hardcore",
    "Whether to enable hardcore mode.",
    "Difficulty"
  ],
  "pvp": [
    "boolean",
    "PvP",
    "Whether to enable PvP.",
    "Essentials"
  ],
  "allow-flight": [
    "boolean",
    "Allow Flight",
    "Whether to allow players to fly.",
    "Security"
  ],
  "gamemode": [
    "string",
    "Default Gamemode",
    "The default game mode for new players.",
    "Difficulty"
  ],
  "force-gamemode": [
    "boolean",
    "Force Gamemode",
    "Whether to force players to join in the default game mode.",
    "Difficulty"
  ],
  "difficulty": [
    ["easy",
      "normal",
      "hard"],
    "Difficulty",
    "The difficulty level of the game.",
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
    "Whether to enable the server whitelist.",
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
    "Whether to enable the query protocol.",
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
    "The IP address that the server will bind to.",
    "Essentials"
  ],
  "server-port": [
    "number",
    "Server Port",
    "The port that the server will listen on for incoming connections.",
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
    "Whether to enable the snooper.",
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
    "Whether to generate structures.",
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
