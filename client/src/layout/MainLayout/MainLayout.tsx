import React from "react";
import "./MainLayout.scss";
import { Link } from "@ioncore/theme/Link";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import { Button } from "@ioncore/theme";
import { IconLogin, IconLogout } from "@tabler/icons-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout(props: MainLayoutProps) {
  const user = BaseApi.getUser();

  return (
    <div>
      <header className="ic-header">
        <div className="ic-header-section ic-header-left">
          <Link href="/">
            <img className="ic-header-logo" src="/favicon.ico" alt="IonMC logo" />
            {/* <img className="ic-header-logo" src={logo} alt="IonMC logo" /> */}
          </Link>
          <Link href="/">
            IonMC
          </Link>
        </div>
        <div className="ic-header-section ic-header-right">
          {
            ...(user ? ([
              // When user is logged in
              <Link key={1} href="/server" title="Manage your servers">My servers</Link>,
              user.isAdmin && <Link key={2} href="/admin" title="Admin Dashboard">Admin</Link>,
              <Link key={3} href="/logout"><Button title="Log out" size="small"><IconLogout /></Button></Link>,
              <Link key={4} href={`/user/${user.id}`} title="Profile">{user.username}</Link>,
            ]) : ([
              // When user is not logged in
              <Link key={5} href="/login" title="Login"><IconLogin /></Link>
            ])).filter(Boolean) // Remove falsy values
          }
        </div>
      </header>
      <div>{props.children}</div>
      <footer></footer>
    </div >
  );
}