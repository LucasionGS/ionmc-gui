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
        <h3>
          Welcome to IonMC!
        </h3>
        <p>
          IonMC is a Minecraft server hosting platform.
        </p>

        {!user && (
          <p>
            <Link href="/login">Login</Link> or <Link href="/register">Register</Link> to get started.
          </p>
        )}
      </Paper>
    </MainLayout>
  );
}

export default HomePage;
