import { Link } from "@ioncore/theme/Link";
import { Router, Routes } from "@ioncore/theme/Router";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import { Button, Paper } from "@ioncore/theme";
import { IconArrowBack, IconAsset, IconHome, IconUsers } from "@tabler/icons-react";
import "./Admin.scss";
import IoncoreLoader from "../../components/IoncoreLoader/IoncoreLoader";
import { IconAccessible } from "@tabler/icons-react";
// import { MySharedInterface } from "@shared/shared"; // Shared code between Client and Server

const subRouterPages: Routes = [
  {
    title: "Admin Home",
    path: /^\/admin$/,
    component: async () => {
      const AdminHomePage = (await import("./AdminHome/AdminHome")).default;
      return <AdminHomePage />
    }
  },
  {
    title: "Admin | Users",
    path: /^\/admin\/users$/,
    component: async () => {
      const AdminUsersPage = (await import("./AdminUsers/AdminUsers")).default;
      return <AdminUsersPage />
    }
  },
  {
    title: "Admin | Roles",
    path: /^\/admin\/roles$/,
    component: async () => {
      const AdminRolesPage = (await import("./AdminRoles/AdminRoles")).default;
      return <AdminRolesPage />
    }
  },
  {
    title: "Admin | Assets",
    path: /^\/admin\/assets$/,
    component: async () => {
      const AdminAssetsPage = (await import("./AdminAssets/AdminAssets")).default;
      return <AdminAssetsPage />
    }
  },
];

function AdminPage() {
  // const user = BaseApi.getUser();
  return (
    <div className="admin-page">
      <div className="admin-sidebar">
        <SidebarLink icon={<IconArrowBack />} href="/">Back To Web</SidebarLink>
        <SidebarLink icon={<IconHome />} href="/admin">Home</SidebarLink>
        <SidebarLink icon={<IconUsers />} href="/admin/users">Users</SidebarLink>
        <SidebarLink icon={<IconAccessible />} href="/admin/roles">Roles</SidebarLink>
        <SidebarLink icon={<IconAsset />} href="/admin/assets">Assets</SidebarLink>
      </div>
      <div className="admin-content">
        <Router pages={subRouterPages} loadingPage={() => <IoncoreLoader centered />} />
      </div>
    </div>
  );
}

function SidebarLink(props: { icon?: React.ReactNode, href: string, children: string }) {
  const isActive = window.location.pathname === props.href;
  return (
    <a className={"sidebar-link" + (isActive ? " sidebar-link--active" : "")} href={props.href} title={props.children}>
      <span className="sidebar-link-icon">{props.icon}</span> <span className="sidebar-link-text">{props.children}</span>
    </a>
  );
}

export default AdminPage;
