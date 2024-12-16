import React from "react";
import BaseApi from "./BaseApi";
import { Datapack, ServerAttributes, ServerAttributesExtra, ServerProperties, ServerStatus } from "@shared/models"
import promiseUseHook from "../hooks/promiseUseHook";

namespace ServerApi {
  /**
   * Get a list of all servers that the user has access to.
   */
  export async function getServers(options?: { all?: boolean }) {
    if (options?.all) {
      return BaseApi.GET("/server?all").then((res) => res.json()) as Promise<ServerAttributes[]>;
    }
    return BaseApi.GET("/server").then((res) => res.json()) as Promise<ServerAttributes[]>;
  }

  /**
   * React hook for getting a list of all servers that the user has access to.
   * @returns A tuple containing the servers and a function to refresh the list.
   */
  export const useServers = promiseUseHook(getServers);

  /**
   * Create a new server.
   * @param name Friendly name of the server.
   * @param version Version the server should run.
   * @param ram Amount of RAM to allocate to the server. (in MB. 1024 = 1GB)
   */
  export async function createServer(name: string, version: string, ram: number, opts: {
    client?: "vanilla" | "forge",
    forgeVersion?: string,
  }) {
    return BaseApi.POST("/server", {}, {
      name,
      version,
      ram,
      client: opts.client ?? "vanilla",
      forgeVersion: opts.forgeVersion ?? null,
    }).then((res) => res.json()) as Promise<ServerAttributes>;
  }

  /**
   * Get a server by ID.
   * @param id The ID of the server to get.
   */
  export async function getServer(id: string) {
    return BaseApi.GET(`/server/${id}`).then((res) => res.json()) as Promise<ServerAttributesExtra>;
  }

  /**
   * React hook for getting a server by ID.
   * @param id The ID of the server to get.
   * @returns A tuple containing the server and a function to refresh the server.
   */
  export const useServer = promiseUseHook(getServer);

  /**
   * Start a server.
   * @param id The ID of the server to start.
   */
  export async function getServerLog(id: string) {
    return BaseApi.GET(`/server/${id}/logs`).then((res) => res.json()) as Promise<string[]>;
  }

  /**
   * Start a server.
   * @param id The ID of the server to start.
   */
  export async function startServer(id: string) {
    return BaseApi.GET(`/server/${id}/start`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Stop a server.
   * @param id The ID of the server to stop.
   */
  export async function stopServer(id: string) {
    return BaseApi.GET(`/server/${id}/stop`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Get a list of all versions that the user has access to.
   */
  export async function getVersions() {
    return BaseApi.GET("/version").then((res) => res.json()) as Promise<string[]>;
  }
  
  /**
   * React hook for getting a list of all versions that the user has access to.
   * @returns A tuple containing the versions and a function to refresh the list.
  */
 export const useVersions = promiseUseHook(getVersions);
  
  /**
   * Get a list of all versions that the user has access to.
   */
  export async function getForgeVersions(version: string) {
    return BaseApi.GET(`/version?client=forge&version=${version}`).then((res) => res.json()) as Promise<string[]>;
  }
 
  /**
   * React hook for getting a list of all forge versions that the user has access to.
   * @returns A tuple containing the versions and a function to refresh the list.
   */
  export const useForgeVersions = promiseUseHook(getForgeVersions);

  /**
   * Get a server's properties.
   * @param id The ID of the server to get the properties for.
   */
  export async function getServerProperties(id: string) {
    return BaseApi.GET(`/server/${id}/properties`).then((res) => res.json()) as Promise<ServerProperties>;
  }

  /**
   * React hook for getting a server's properties.
   * @param id The ID of the server to get the properties for.
   * @returns A tuple containing the properties and a function to refresh the properties.
   */
  export const useServerProperties = promiseUseHook(getServerProperties);

  /**
   * Update a server's properties.
   * @param id The ID of the server to update the properties for.
   * @param properties The properties to update.
   */
  export async function updateServerProperties(id: string, properties: Partial<ServerProperties>) {
    return BaseApi.PUT(`/server/${id}/properties`, {}, properties).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Get the server's status.
   */
  export async function getStatus(id: string) {
    return BaseApi.GET(`/server/${id}/status`).then((res) => res.json()) as Promise<ServerStatus>;
  }

  /**
   * React hook for getting the server's status.
   * @returns A tuple containing the status and a function to refresh the status.
   */
  export const useStatus = promiseUseHook(getStatus);

  /**
   * Fetch the data from the server's world.
   * @param id The ID of the server to fetch the world data from.
   */
  export async function getWorldData(id: string) {
    return BaseApi.GET(`/server/${id}/world`).then((res) => res.json()) as Promise<string>;
  }

  /**
   * React hook for fetching the data from the server's world.
   * @param id The ID of the server to fetch the world data from.
   * @returns A tuple containing the world data and a function to refresh the data.
   */
  export const useWorldData = promiseUseHook(getWorldData);


  /**
   * Download a zip file containing the server's world.
   * @param id The ID of the server to download the world from.
   */
  export async function downloadWorld(id: string) {
    const url = `${BaseApi.baseUrl}/server/${id}/world/download`;
    console.log(url);
    const link = document.createElement("a");
    link.href = url;
    link.download = `world-${id}.zip`;
    link.click();
    // const blob = await BaseApi.GET(`${BaseApi.baseUrl}/server/${id}/world/download`).then(r => r.blob());
    // const url = window.URL.createObjectURL(blob);
    // window.location.assign(url);
  }

  /**
   * Upload a zip file containing the server's world.
   * @param id The ID of the server to upload the world to.
   * @param file The file to upload.
   */
  export async function uploadWorld(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return BaseApi.POSTFormData(`/server/${id}/world/upload`, {}, formData).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Reset the server's world.
   */
  export async function resetWorld(id: string) {
    return BaseApi.POST(`/server/${id}/world/reset`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Delete a server.
   */
  export async function deleteServer(id: string) {
    return BaseApi.DELETE(`/server/${id}`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Get a list of all datapacks that the current world has.
   */
  export async function getDatapacks(id: string) {
    return BaseApi.GET(`/server/${id}/datapacks`).then((res) => res.json()) as Promise<Datapack[]>;
  }

  /**
   * React hook for getting a list of all datapacks that the current world has.
   * @returns A tuple containing the datapacks and a function to refresh the list.
   */
  export const useDatapacks = promiseUseHook(getDatapacks);

  /**
   * Upload a zip file containing a datapack.
   */
  export async function uploadDatapack(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return BaseApi.POSTFormData(`/server/${id}/datapacks`, {}, formData).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Delete a datapack.
   */
  export async function deleteDatapack(id: string, name: string) {
    return BaseApi.DELETE(`/server/${id}/datapacks/${name}`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  export async function updateServerVersion(id: string, version: string) {
    return BaseApi.POST(`/server/${id}/version`, {}, { version }).then((res) => res.json()) as Promise<{ message: string }>;
  }

  export async function uploadMod(id: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return BaseApi.POSTFormData(`/server/${id}/mods`, {}, formData).then((res) => res.json()) as Promise<{ message: string }>;
  }

  export async function uploadModManifest(id: string, file: File) {
    const formData = new FormData();
    formData.append("manifest", file);
    return BaseApi.POSTFormData(`/server/${id}/mods`, {}, formData).then((res) => res.json()) as Promise<{ message: string }>;
  }

  export async function installMod(id: string, ...modId: number[]) {
    return BaseApi.POST(`/server/${id}/mods`, {}, { modId }).then((res) => res.json()) as Promise<{ message: string }>;
  }

  export async function getMods(id: string) {
    return BaseApi.GET(`/server/${id}/mods`).then((res) => res.json()) as Promise<{
      available: [],
      enabled: []
    }>;
  }

  export const useMods = promiseUseHook(getMods);

  export async function deleteMod(id: string, name: string) {
    return BaseApi.DELETE(`/server/${id}/mods/${name}`).then((res) => res.json()) as Promise<{ message: string }>;
  }
}

export default ServerApi;