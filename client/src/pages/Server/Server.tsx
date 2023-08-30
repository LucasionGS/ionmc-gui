import { Link } from "@ioncore/theme/Link";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import "./Server.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import { Button, Checkbox, Paper } from "@ioncore/theme";
import ServerApi from "../../Api/ServerApi";
import IoncoreLoader from "../../components/IoncoreLoader/IoncoreLoader";
import { ServerAttributes, ServerStatus } from "@shared/models";
import React from "react";
import SocketApi from "../../Api/SocketApi";
// import { MySharedInterface } from "@shared/shared"; // Shared code between Client and Server

function ServerPage() {
  const user = BaseApi.getUser();
  const [showAllServers, setShowAllServers] = React.useState(false);
  const [servers, refresh] = ServerApi.useServers({ all: showAllServers });

  React.useEffect(() => {
    refresh({ all: showAllServers });
  }, [showAllServers]);

  return (
    <MainLayout>
      <Paper>
        <h2>My servers</h2>
        <p>Here is your list of servers. You can create a new server or manage your existing.</p>
        {
          user?.isAdmin ? (
            <Checkbox alwaysShowTick label="(Admin) Show all servers" checked={showAllServers} onChange={c => setShowAllServers(c)} />
          ) : null
        }
        {!servers ? (
          <IoncoreLoader />
        ) : (
          <table className="server-list">
            <thead>
              {/* Create new server */}
              <tr>
                <td colSpan={3}>
                  <Link href="/server/create">
                    <Button fullWidth>Create new server</Button>
                  </Link>
                </td>
              </tr>
              <tr>
                <th>Name</th>
                <th>Port</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {servers.map(server => (
                <ServerItem key={server.id} server={server} refresh={() => refresh()} />
              ))}
            </tbody>
          </table>
        )}
      </Paper>
    </MainLayout>
  );
}

export default ServerPage;

function ServerItem(props: { server: ServerAttributes, refresh: () => void }) {
  const { server, refresh } = props;
  const [status, setStatus] = React.useState<ServerStatus | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  React.useEffect(() => {
    ServerApi.getStatus(server.id).then(setStatus);
    SocketApi.subscribeServer(server.id, (_, s) => s && setStatus(s));

    return () => {
      SocketApi.unsubscribeServer(server.id);
    };
  }, []);
  return (<tr>
    {status ?
      (
        <td><span style={{
          display: "inline-block",
          width: "0.6rem",
          height: "0.6rem",
          borderRadius: "50%",
          backgroundColor: status.status === "running" ? "green" : status.status === "starting" ? "yellow" : "red",
          transform: "translateY(0.1rem)",
        }}></span> {server.name}</td>
      ) : (
        <td>{server.name}</td>
      )
    }
    <td>{server.port}</td>
    <td style={{
      display: "flex",
      flexDirection: "row",
      gap: "0.5rem",
      flexWrap: "wrap",
    }}>
      {
        <>
          {deleting ? null : (
            <>
              <Link href={`/server/${server.id}`}><Button size="small">Manage</Button></Link>
              {
                status?.status === "running" ? (
                  <Button onClick={() => {
                    setStatus({
                      ...status,
                      status: "stopping" as any,
                    });
                    ServerApi.stopServer(server.id);
                  }} variant="danger" size="small">Stop</Button>
                ) : status?.status === "offline" ? (
                  <Button onClick={() => {
                    ServerApi.startServer(server.id);
                  }} variant="success" size="small">Start</Button>
                ) : (
                  <Button disabled variant="success" size="small">{status?.status}</Button>
                )
              }
            </>
          )}
          <Button
            disabled={deleting}
            onClick={() => {
              setDeleting(true);
              ServerApi.deleteServer(server.id).then(() => {
                refresh();
              });
            }}
            variant="danger"
            size="small"
            fullWidth={deleting}
          >
            {deleting ? "Stopping & deleting..." : "Delete"}
          </Button>
        </>
      }
    </td>
  </tr>);
}
