import React from "react";
import BaseApi from "./BaseApi";
import { ServerAttributes, ServerProperties, ServerStatus } from "@shared/models"
import promiseUseHook from "../hooks/promiseUseHook";

namespace ServerApi {
  /**
   * Get a list of all servers that the user has access to.
   */
  export function getServers() {
    return BaseApi.GET("/server").then((res) => res.json()) as Promise<ServerAttributes[]>;
  }

  /**
   * React hook for getting a list of all servers that the user has access to.
   * @returns A tuple containing the servers and a function to refresh the list.
   */
  export function useServers() {
    const [servers, setServers] = React.useState<ServerAttributes[] | null>(null);
    const [refresh, _setRefresh] = React.useState(0);
    const setRefresh = () => _setRefresh(refresh + 1 % 2);
    React.useEffect(() => {
      getServers().then(setServers);
    }, [refresh]);
    return [servers, setRefresh] as const;
  }

  /**
   * Create a new server.
   * @param name Friendly name of the server.
   * @param version Version the server should run.
   * @param ram Amount of RAM to allocate to the server. (in MB. 1024 = 1GB)
   */
  export function createServer(name: string, version: string, ram: number) {
    return BaseApi.POST("/server", {}, { name, version, ram }).then((res) => res.json()) as Promise<ServerAttributes>;
  }

  /**
   * Get a server by ID.
   * @param id The ID of the server to get.
   */
  export function getServer(id: string) {
    return BaseApi.GET(`/server/${id}`).then((res) => res.json()) as Promise<ServerAttributes>;
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
  export function getServerLog(id: string) {
    return BaseApi.GET(`/server/${id}/logs`).then((res) => res.json()) as Promise<string[]>;
  }

  /**
   * Start a server.
   * @param id The ID of the server to start.
   */
  export function startServer(id: string) {
    return BaseApi.GET(`/server/${id}/start`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Stop a server.
   * @param id The ID of the server to stop.
   */
  export function stopServer(id: string) {
    return BaseApi.GET(`/server/${id}/stop`).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Get a list of all versions that the user has access to.
   */
  export function getVersions() {
    return BaseApi.GET("/version").then((res) => res.json()) as Promise<string[]>;
  }

  /**
   * React hook for getting a list of all versions that the user has access to.
   * @returns A tuple containing the versions and a function to refresh the list.
   */
  export const useVersions = promiseUseHook(getVersions);

  /**
   * Get a server's properties.
   * @param id The ID of the server to get the properties for.
   */
  export function getServerProperties(id: string) {
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
  export function updateServerProperties(id: string, properties: Partial<ServerProperties>) {
    return BaseApi.PUT(`/server/${id}/properties`, {}, properties).then((res) => res.json()) as Promise<{ message: string }>;
  }

  /**
   * Get the server's status.
   */
  export function getStatus(id: string) {
    return BaseApi.GET(`/server/${id}/status`).then((res) => res.json()) as Promise<ServerStatus>;
  }

  /**
   * React hook for getting the server's status.
   * @returns A tuple containing the status and a function to refresh the status.
   */
  export const useStatus = promiseUseHook(getStatus);
}

export default ServerApi;