import React, { Fragment } from "react";
import ServerApi from "../../../Api/ServerApi";
import SocketApi from "../../../Api/SocketApi";
import MainLayout from "../../../layout/MainLayout/MainLayout";
import IoncoreLoader from "../../../components/IoncoreLoader/IoncoreLoader";
import { Button, ButtonProps, Checkbox, Input, Paper, Modal, useModal, useManagedModal, SelectInput, Select } from "@ioncore/theme";
import { Link } from "@ioncore/theme/Link";
import { ServerAttributes, ServerProperties, ServerStatus } from "@shared/models";
import { serverSettingsDetails } from "./serverSettingsDetails";
import "./ServerView.scss";
import { IconCircleLetterQ, IconQuestionMark, IconZoomCancel, IconZoomQuestion } from "@tabler/icons-react";
// import Modal, { useModal } from "../../../components/Modal/Modal";
export interface ServerViewProps {
  id: string;
}

const buttonStyle: ButtonProps = {
  style: {
    background: "transparent",
    color: "cyan",
  },
  fullWidth: true,
}

const SidepanelButton = (props: {
  href: string;
  children: React.ReactNode;
  currentHash: string;
}) => {
  const isActive = props.href.endsWith(props.currentHash);
  const newProps = { ...buttonStyle };
  if (isActive) {
    newProps.style = {
      ...newProps.style,
      background: "cyan",
      color: "black",
    };
  }
  return <Link href={props.href}><Button {...newProps}>{props.children}</Button></Link>;
}

export default function ServerViewPage(props: ServerViewProps) {
  const { id } = props;
  const [server, refreshServer] = ServerApi.useServer(id);
  const route = React.useMemo(() => {
    return window.location.hash.split("#").pop()! || "terminal";
  }, [window.location.hash]);

  const Panel = React.useMemo(() => {
    const panel = route;
    switch (panel) {
      case "terminal": return ServerViewPanel_Terminal;
      case "settings": return ServerViewPanel_Settings;
      case "world": return ServerViewPanel_World;
      default: return ServerViewPanel_Terminal;
    }
  }, [route]);

  return (
    <MainLayout>
      {server ? (
        <div className="server-view-wrapper">
          <Paper className="server-view-navigation">
            <SidepanelButton currentHash={route} href={`/server/${server.id}#terminal`} >Web Terminal</SidepanelButton>
            <SidepanelButton currentHash={route} href={`/server/${server.id}#settings`} >Server Settings</SidepanelButton>
            <SidepanelButton currentHash={route} href={`/server/${server.id}#world`}   >World Manager</SidepanelButton>
            <SidepanelButton currentHash={route} href={`/server/${server.id}#datapacks`}>Datapack Manager</SidepanelButton>
          </Paper>
          <Paper
            style={{
              flex: 1,
            }}
          >
            <Panel server={server} />
          </Paper>
        </div>
      ) : (
        <IoncoreLoader />
      )}
    </MainLayout>
  );
}

interface ServerViewPanelProps {
  server: ServerAttributes
}

function firstUppercase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Panels
/**
 * Terminal panel to interact with the server console.
 */
function ServerViewPanel_Terminal(props: ServerViewPanelProps) {
  const { server } = props;
  const logDiv = React.useRef<HTMLDivElement>(null);
  const [currentStatus, refreshStatus, setCurrentStatus] = ServerApi.useStatus(server.id);

  React.useEffect(() => {
    SocketApi.subscribeServer(server.id, (data, newStatus) => {
      if (data) {
        console.log(data);
        addLog(data);
      }
      if (newStatus) {
        setCurrentStatus(newStatus);
      }
    });

    ServerApi.getServerLog(server.id).then(logs => {
      logs.reverse();
      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        addLog(log);
      }
    });

    return () => {
      SocketApi.unsubscribeServer(server.id);
    };
  }, [server.id]);

  const [logs, addLog] = React.useReducer((state: string[], action: string) => {
    setTimeout(() => {
      if (logDiv.current) {
        logDiv.current.scrollTop = logDiv.current.scrollHeight;
      }
    }, 10);
    return [...state, action];
  }, []);
  const [commandInput, setCommandInput] = React.useState("");

  return (
    <div
      className="server-view-terminal"
    >
      <Paper style={{
        width: "100%",
        backgroundColor: "#111111",
      }}>
        <div ref={logDiv} style={{
          width: "100%",
          height: "calc(80vh - 6rem)",
          overflowY: "auto",
        }}>
          {logs.map((log, i) => {
            return <TerminalLine key={i} text={log} />;
          })}
        </div>
        <Input
          containerStyle={{
            width: "100%",
          }}
          style={{
            width: "100%",
            filter: currentStatus?.status !== "running" ? "brightness(0.5)" : "",
          }}
          autoCapitalize="off"

          value={commandInput} onChange={(e) => {
            setCommandInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              SocketApi.sendServerCommand(server.id, commandInput, true);
              setCommandInput("");
            }
          }}
          placeholder={currentStatus?.status !== "running" ? "Server is not running" : "Enter command..."}
          disabled={currentStatus?.status !== "running"}
        />
      </Paper>
      <Paper
        className="server-view-terminal-info"
      >
        <h2>{server.name}</h2>
        <p>Port: {server.port}</p>
        <p>Version: {server.version}</p>
        <p>RAM: {server.ram} MB</p>
        <p>Status: <span style={{
          color: currentStatus?.status === "running" ? "lightgreen" : currentStatus?.status === "starting" ? "yellow" : "red",
        }}>{firstUppercase(currentStatus?.status ?? "?")}</span></p>
        {
          currentStatus && (
            currentStatus.status === "running" ? (
              <Button fullWidth variant="danger" onClick={() => {
                (currentStatus as any).status = "stopping...";
                setCurrentStatus(currentStatus);
                ServerApi.stopServer(server.id).then((res) => {
                  addLog(res.message);
                });
              }}>
                Stop
              </Button>
            ) : currentStatus.status === "offline" ? (
              <Button fullWidth variant="success" onClick={() => {
                ServerApi.startServer(server.id).then((res) => {
                  addLog(res.message);
                });
              }}>
                Start
              </Button>
            ) : null
          )
        }
        {
          currentStatus?.status === "running" && (<PlayerList serverId={server.id} {...currentStatus} />)
        }
      </Paper>
    </div>
  );
}

function TerminalLine(props: {
  text: string;
}) {
  // Format with colors
  // [xx:xx:xx] [SOURCE/TYPE]: text
  const regex = /\[(\d{2}:\d{2}:\d{2})\] \[([\w\s-]+)\/(\w+)\]: (.+)/;
  const match = props.text?.match(regex);

  return (
    <p className="terminal-line">
      {match ? (
        <>
          <span style={{
            color: "gray",
          }}>{match[1]}</span>
          <span style={{
            color: "cyan",
          }}> [{match[2]}/{match[3]}]:</span>
          <span>&nbsp;{match[4]}</span>
        </>
      ) : (
        <span>{props.text}</span>
      )}
    </p>
  );
}

function PlayerList(props: {
  players: string[];
  admins: string[];
  serverId: string;
}) {
  const { players, serverId, admins } = props;
  return (
    <div>
      {admins.length > 0 && (
        <>
          <h3>Admins</h3>
          <ul style={{
            listStyle: "none",
            padding: 0,
            borderLeft: "4px solid #FFD700",
          }}>
            {admins.map((player, i) => {
              return <li key={player}>
                <PlayerListItem player={player} serverId={serverId} isAdmin={admins.includes(player)} isOnline={players.includes(player)} />
              </li>;
            })}
          </ul>
        </>
      )}
      <h3>Players</h3>
      <ul style={{
        listStyle: "none",
        padding: 0,
        borderLeft: "4px solid #424242",
      }}>
        {players.map((player, i) => {
          return <li key={player}>
            <PlayerListItem player={player} serverId={serverId} isAdmin={admins.includes(player)} isOnline={true} />
          </li>;
        })}
      </ul>
    </div>
  );
}

function PlayerListItem(props: {
  player: string;
  isAdmin: boolean;
  serverId: string;
  isOnline: boolean;
}) {
  const { player, serverId, isAdmin, isOnline } = props;
  const pm = useManagedModal();

  return (
    <>
      <Button style={{
        background: "transparent",
        color: isAdmin ? "cyan" : "white",
      }} onClick={() => pm.open()}>
        {player}
      </Button>
      <pm.Modal closeOnOutsideClick>
        <h2>{player}</h2>
        <p>Player information</p>
        <div style={{
          display: "flex",
          flexDirection: "row",
          gap: 8,
        }}>
          <Button variant="warning" onClick={() => {
            SocketApi.sendServerCommand(serverId, isAdmin ? `deop ${player}` : `op ${player}`, true);
            pm.close();
          }}>{isAdmin ? "Deop" : "Op"}</Button>

          {isOnline && (
            <>
              {/* TODO: SelectInput doesn't change the value, fix this in @ioncore/theme */}
              <SelectInput options={["<Gamemode>", "survival", "creative", "adventure", "spectator"]} onChange={(value) => {
                if (value === "<Gamemode>") return;
                SocketApi.sendServerCommand(serverId, `gamemode ${value} ${player}`, true);
              }} />

              <Button variant="danger" onClick={() => {
                SocketApi.sendServerCommand(serverId, `kill ${player}`, true);
                pm.close();
              }}>Kill</Button>

              <Button variant="danger" onClick={() => {
                SocketApi.sendServerCommand(serverId, `kick ${player}`, true);
                pm.close();
              }}>Kick</Button>

              <Button variant="danger" onClick={() => {
                SocketApi.sendServerCommand(serverId, `ban ${player}`, true);
                pm.close();
              }}>Ban</Button>
            </>
          )}
        </div>
        <hr />
        <div style={{
          textAlign: "right",
        }}>
          <Button variant="secondary" onClick={pm.close}>Close</Button>
        </div>
      </pm.Modal>
    </>
  );
}

function ServerViewPanel_Settings(props: ServerViewPanelProps) {
  const saveModal = useManagedModal();
  const [modalMessage, setModalMessage] = React.useState("");
  const { server } = props;
  const [settings, refresh] = ServerApi.useServerProperties(server.id);

  const [formData, updateFormData] = React.useReducer((state: Partial<ServerProperties>, action: { key: keyof ServerProperties; value: any; }) => {
    const newState: Partial<ServerProperties> = { ...state };
    (newState as any)[action.key] = action.value;
    return newState;
  }, settings || {});

  React.useEffect(() => {
    // Update when the settings are refreshed
    if (settings) {
      for (const key in settings) {
        const value = settings[key as keyof ServerProperties];
        if (formData[key as keyof ServerProperties] !== value) {
          updateFormData({
            key: key as keyof ServerProperties,
            value,
          });
        }
      }
    }
  }, [settings]);

  // Category order. None listed goes to the bottom.
  const catOrder = [
    "Essentials",
    "General",
    "World",
    "Network",
    "Performance",
    "Security",
    "RCON",
    "Difficulty",
    "Query",
    "Resource Pack",
    "Advanced",
    // None listed
    "Uncategorized"
  ];

  const allSettingsKeys = React.useMemo(() => {
    const keys = Object.keys(serverSettingsDetails) as (keyof ServerProperties)[];
    if (settings) keys.push(...Object.keys(settings) as (keyof ServerProperties)[]);
    return [...new Set(keys)];
  }, [settings]).sort().sort((a, b) => {
    const aDetails = serverSettingsDetails[a];
    const bDetails = serverSettingsDetails[b];
    const aCategory = aDetails ? (aDetails[3] ?? "Uncategorized") : "Uncategorized";
    const bCategory = bDetails ? (bDetails[3] ?? "Uncategorized") : "Uncategorized";
    const aIndex = catOrder.indexOf(aCategory);
    const bIndex = catOrder.indexOf(bCategory);
    if (aIndex === bIndex) {
      return a > b ? 1 : -1;
    } else {
      return aIndex > bIndex ? 1 : -1;
    }
  });

  let category = "";

  const saveButton = React.useMemo(() => {
    return (
      <Button
        fullWidth
        variant="success"
        onClick={e => {
          e.preventDefault();

          // Get the keys that have changed
          const changedKeys = Object.keys(formData).filter(key => {
            return formData[key as keyof ServerProperties] !== settings?.[key as keyof ServerProperties];
          });

          if (changedKeys.length === 0) {
            return;
          }

          // Only update the changed keys
          const changedData: Partial<ServerProperties> = {};
          for (const key of changedKeys) {
            (changedData as any)[key as keyof ServerProperties] = formData[key as keyof ServerProperties];
          }

          ServerApi.updateServerProperties(server.id, changedData).then(({ message }) => {
            setModalMessage(message);
            saveModal.open();
            refresh(server.id);
          });
        }}
      >
        Save
      </Button>
    );
  }, [formData]);
  return (
    <div>
      <form>
        <div style={{
          position: "sticky",
          top: 0,
          background: "#212121",
          paddingTop: 16,
          paddingBottom: 16,
          borderBottom: "4px solid #424242",
          borderBottomRightRadius: 4,
          borderBottomLeftRadius: 4,
          boxShadow: "4px 8px 4px rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}>
          <h2>{server.name}</h2>
          <p>Settings for the minecraft server</p>
          {saveButton}
        </div>
        {settings ? (
          <div style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8
          }}>
            {allSettingsKeys.map((key) => {
              // console.log(key);
              // console.log(details);
              const details = serverSettingsDetails[key as keyof ServerProperties];
              const type = details ? details[0] : typeof settings[key as keyof ServerProperties];
              const name = details ? details[1] : key;
              const description = details ? details[2] : "";
              const nCategory = details && details[3] ? details[3] : "Uncategorized";
              const isNewCategory = category !== nCategory;
              category = nCategory;

              return (
                <Fragment key={key}>
                  {isNewCategory && <h2 style={{
                    color: "#d4b400",
                    width: "100%",
                  }}>{category}</h2>}
                  <Paper className="server-view-settings-block">
                    <h3 style={{ margin: 0, marginLeft: 4 }} title={description}>{name} {description && <IconZoomQuestion style={{ transform: "translateY(6px)" }} />}</h3>
                    {/* <p>{description}</p> */}
                    {type === "boolean" ? (
                      <Checkbox
                        checked={formData[key as keyof ServerProperties] as boolean}
                        label={name}
                        alwaysShowTick
                        onChange={(c) => {
                          const value = c;
                          updateFormData({
                            key: key as keyof ServerProperties,
                            value,
                          });
                        }}
                      />
                    ) : type === "number" ? (
                      <Input
                        type="number"
                        value={formData[key] as number}
                        onChange={(e) => {
                          const value = e.target.valueAsNumber;
                          updateFormData({
                            key: key,
                            value,
                          });
                        }}
                        containerStyle={{ width: "100%" }}
                        style={{ width: "100%" }}
                      />
                    // ) : Array.isArray(type) ? ( // Not working for some reason, defaulting to text input
                    //   /* TODO: SelectInput doesn't change the value, fix this in @ioncore/theme */
                    //   <SelectInput
                    //     options={type}
                    //     value={formData[key] as string}
                    //     onChange={(value) => {
                    //       updateFormData({
                    //         key: key,
                    //         value,
                    //       });
                    //     }}
                    //   />
                    ) : (
                      <Input
                        type="text"
                        value={formData[key] as string}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateFormData({
                            key: key,
                            value,
                          });
                        }}
                        containerStyle={{ width: "100%" }}
                        style={{ width: "100%" }}
                      />
                    )}
                  </Paper>
                </Fragment>
              );
            })}
          </div>
        ) : (
          <>
            <IoncoreLoader />
            <p>Make sure you have run the server at least once before changing the settings.</p>
          </>
        )}
      </form>
      <saveModal.Modal closeOnOutsideClick>
        <h2>Saved</h2>
        <p>{modalMessage}</p>
        <Button onClick={saveModal.close}>Close</Button>
      </saveModal.Modal>
    </div>
  );
}

function ServerViewPanel_World(props: ServerViewPanelProps) {
  const { server } = props;
  const uploadWorldModal = useManagedModal();
  const resetWorldModal = useManagedModal();

  return (
    <div>
      <h2>{server.name}</h2>
      <p>World manager</p>
      <Button onClick={() => ServerApi.downloadWorld(server.id)}>Download world</Button>
      <Button onClick={uploadWorldModal.open}>Upload world</Button>
      <Button onClick={resetWorldModal.open}>Reset world</Button>

      <uploadWorldModal.Modal closeOnOutsideClick>
        <h2>Upload world</h2>
        <p>
          Upload a world to the server.
          <br />
          <span style={{ color: "#ff1e1e" }} >This will override the current world. Downloading a backup first is highly recommended.</span>
        </p>
        <Button onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".zip";
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            ServerApi.uploadWorld(server.id, file).then(() => {
              uploadWorldModal.close();
            });
          };
          input.click();
        }}>
          Select world (zip)
        </Button>
        <Button onClick={uploadWorldModal.close}>Close</Button>
      </uploadWorldModal.Modal>
    </div>
  );
}