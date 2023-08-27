import React from "react"
import ReactDOM from "react-dom/client"
import "./index.scss"
import { Router, Route } from "@ioncore/theme/Router"
import { IoncoreProvider } from "@ioncore/theme"
import IoncoreLoader from "./components/IoncoreLoader/IoncoreLoader"
import UserApi from "./Api/UserApi"
import BaseApi from "./Api/BaseApi"
import ErrorPage from "./pages/Error/Error"

function requirement(opts: {
  admin?: boolean,
  loggedIn?: boolean,
  role?: string,
  permission?: string,
}, route: Route): Route {
  return {
    title: route.title,
    path: route.path,
    component: async (...args) => {
      const user = BaseApi.getUser();
      if (opts.loggedIn) {
        if (!user) {
          return <ErrorPage error={new Error("Not logged in")} statusCode={401} />
        }
      }

      if (opts.admin) {
        if (!user?.isAdmin) {
          return <ErrorPage error={new Error("Not authorized")} statusCode={403} />
        }
      }

      if (opts.role) {
        if (!await UserApi.hasRole(opts.role)) {
          return <ErrorPage error={new Error("Not authorized")} statusCode={403} />
        }
      }
      
      if (opts.permission) {
        try {
          if (!await UserApi.hasPermission(opts.permission)) {
            return <ErrorPage error={new Error("Not authorized, missing permission")} statusCode={403} />
          }
        } catch (error) {
          return <ErrorPage error={new Error("Not logged in")} statusCode={401} />
        }
      }

      return typeof route.component === "function" ? await route.component(...args) : route.component;
    }
  }
}

const pages: Route[] = [
  {
    path: /^\/$/,
    title: "Home",
    component: async () => {
      const HomePage = (await import("./pages/Home/Home")).default;
      return <HomePage />
    },
  },
  {
    path: /^\/login$/,
    title: "Login",
    component: async () => {
      const LoginPage = (await import("./pages/Login/Login")).default;
      return <LoginPage />
    },
  },
  {
    path: /^\/logout$/,
    title: "Logging out...",
    component: async () => {
      BaseApi.logout();
      return <IoncoreLoader centered />
    },
  },
  {
    path: /^\/server$/,
    title: "Server",
    component: async () => {
      const ServerPage = (await import("./pages/Server/Server")).default;
      return <ServerPage />
    },
  },
  {
    path: /^\/server\/create$/,
    title: "Server / Create",
    component: async () => {
      const ServerCreatePage = (await import("./pages/Server/ServerCreate/ServerCreate")).default;
      return <ServerCreatePage />
    },
  },
  {
    path: /^\/server\/([^\/]+?)$/,
    title: "Server / View",
    component: async (id) => {
      console.log("ServerViewPage", id);
      const ServerViewPage = (await import("./pages/Server/ServerView/ServerView")).default;
      return <ServerViewPage id={id} />
    },
  },
  {
    path: /^\/server\/([^\/]+?)(\/)?#(terminal|settings|world|datapacks)$/,
    title: (id, location) => "Server / " + location[0].toUpperCase() + location.slice(1).toLowerCase(),
    component: async (id) => {
      console.log("ServerViewPage", id);
      const ServerViewPage = (await import("./pages/Server/ServerView/ServerView")).default;
      return <ServerViewPage id={id} />
    },
  },
  requirement({ permission: "DASHBOARD_VIEW" }, {
    path: /^\/admin(\/|$)/,
    title: "Admin",
    component: async () => {
      const AdminPage = (await import("./pages/Admin/Admin")).default;
      return <AdminPage />
    },
  }),
]

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <IoncoreProvider theme={{ scheme: "dark" }}>
      <Router pages={pages} loadingPage={() => <IoncoreLoader centered />} errorPage={ErrorPage} />
    </IoncoreProvider>
  </React.StrictMode>,
);

