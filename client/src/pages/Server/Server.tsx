import { Link } from "@ioncore/theme/Link";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import "./Server.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import { Button, Paper } from "@ioncore/theme";
import ServerApi from "../../Api/ServerApi";
import IoncoreLoader from "../../components/IoncoreLoader/IoncoreLoader";
// import { MySharedInterface } from "@shared/shared"; // Shared code between Client and Server

function ServerPage() {
  // const user = BaseApi.getUser();
  const [servers, refresh] = ServerApi.useServers();
  return (
    <MainLayout>
      <Paper>
        <h2>My servers</h2>
        <p>Here is your list of servers. You can create a new server or manage your existing.</p>
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
                <tr key={server.id}>
                  <td>{server.name}</td>
                  <td>{server.port}</td>
                  <td>
                    <Link href={`/server/${server.id}`}><Button fullWidth size="small">Manage</Button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Paper>
    </MainLayout>
  );
}

export default ServerPage;
