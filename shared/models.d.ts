import { UserAttributes } from "../server/src/sequelize";
export { default as ServerProperties } from "../server/node_modules/ionmc/shared/ServerProperties";

export { ServerStatus, Datapack } from "../server/src/ServerManager";

export { UserAttributes, RoleAttributes, RoleAttributesObject, AssetAttributes, ServerAttributes } from "../server/src/sequelize";
export interface ClientUser extends Omit<UserAttributes, "password"> {
  roles?: string[];
  isAdmin: boolean;
}