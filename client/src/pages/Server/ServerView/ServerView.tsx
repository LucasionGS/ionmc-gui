import React from "react";
import ServerApi from "../../../Api/ServerApi";
import MainLayout from "../../../layout/MainLayout/MainLayout";
import IoncoreLoader from "../../../components/IoncoreLoader/IoncoreLoader";
import { Button, ButtonProps, Checkbox, Input, Paper } from "@ioncore/theme";
import { Link } from "@ioncore/theme/Link";
import { ServerAttributes, ServerProperties } from "@shared/models";
import { serverSettingsDetails } from "./serverSettingsDetails";
import "./ServerView.scss";
import { SelectInput } from "../../../components/SelectInput/SelectInput";
import Modal, { useModal } from "../../../components/Modal/Modal";
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
            <SidepanelButton currentHash={route} href={`/server/${server.id}#worlds`}   >World Manager</SidepanelButton>
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

// Panels
/**
 * Terminal panel to interact with the server console.
 */
function ServerViewPanel_Terminal(props: ServerViewPanelProps) {
  const { server } = props;
  return (
    <div>
      <h2>{server.name}</h2>
      <p>Port: {server.port}</p>
      <p>Version: {server.version}</p>
      <p>RAM: {server.ram} MB</p>
    </div>
  );
}

function ServerViewPanel_Settings(props: ServerViewPanelProps) {
  const saveModal = useModal();
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
    for (const key in settings) {
      const value = settings[key as keyof ServerProperties];
      if (formData[key as keyof ServerProperties] !== value) {
        updateFormData({
          key: key as keyof ServerProperties,
          value,
        });
      }
    }
  }, [settings]);

  // Category order. None listed goes to the bottom.
  const catOrder = [
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
        }}>
          <h2>{server.name}</h2>
          <p>Settings for the minecraft server</p>
          {saveButton}
        </div>
        {settings ? (
          <div>
            {allSettingsKeys.map((key) => {
              // console.log(key);
              // console.log(details);
              const details = serverSettingsDetails[key as keyof ServerProperties];
              const type = details ? details[0] : typeof settings[key as keyof ServerProperties];
              const name = details ? details[1] : key;
              const description = details ? details[2] : "";
              const nCategory = details ? details[3] as string : "Uncategorized";
              const isNewCategory = category !== nCategory;
              category = nCategory;

              return (
                <div key={key}>
                  {isNewCategory && <h2>{category}</h2>}
                  <h3>{name}</h3>
                  <p>{description}</p>
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
                    />
                  ) : Array.isArray(type) ? (
                    <SelectInput
                      options={type}
                      value={formData[key] as string}
                      onChange={(value) => {
                        updateFormData({
                          key: key,
                          value,
                        });
                      }}
                    />
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
                    />
                  )}
                  <hr />
                </div>
              );
            })}
          </div>
        ) : (
          <IoncoreLoader />
        )}
      </form>
      <Modal onClose={saveModal.close} opened={saveModal.isOpen} closeOnOutsideClick>
        <h2>Saved</h2>
        <p>{modalMessage}</p>
        <Button onClick={saveModal.close}>Close</Button>
      </Modal>
    </div>
  );
}
