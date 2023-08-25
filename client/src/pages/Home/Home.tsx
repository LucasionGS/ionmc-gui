import { Link } from "@ioncore/theme/Link";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import "./Home.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
import { Button, Paper } from "@ioncore/theme";
import ServerApi from "../../Api/ServerApi";
import IoncoreLoader from "../../components/IoncoreLoader/IoncoreLoader";
// import { MySharedInterface } from "@shared/shared"; // Shared code between Client and Server

function HomePage() {
  const user = BaseApi.getUser();
  return (
    <MainLayout>
      <Paper>
        <div style={{
          textAlign: "center",
        }}>
          <img src="/favicon.ico" alt="IonMC" style={{
            width: 128,
            height: 128,
          }} />
          <h3>
            Welcome to IonMC!
          </h3>
          <p>
            IonMC is a Minecraft server hosting platform.
          </p>
          <hr />
          <p>
            IonMC helps you manage your servers for friends, or for your community.
            <br />
            Easily create, manage, and configure multiple servers, each with their own settings, datapacks, and worlds to utilise.
          </p>
          {!user ? (
            <>
              <p>
                <Link href="/login">Login</Link> to get started.
                <br />
              </p>
              <Link href="/login"><Button size="large" fullWidth>Login</Button></Link>
            </>
          ) : (
            <></>
          )}
        </div>

      </Paper>
    </MainLayout>
  );
}

export default HomePage;
