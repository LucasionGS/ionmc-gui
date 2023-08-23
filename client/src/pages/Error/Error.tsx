import { Link } from "@ioncore/theme/Link";
import logo from "../../assets/logo.svg";
import BaseApi from "../../Api/BaseApi";
import "./Error.scss";
import MainLayout from "../../layout/MainLayout/MainLayout";
// import { MySharedInterface } from "@shared/shared"; // Shared code between Client and Server

function ErrorPage(props: {
  statusCode?: number | undefined;
  error?: Error | undefined;
}) {
  const { statusCode, error } = props;
  return (
    <MainLayout>
      <div className="error-page" style={{ textAlign: "center" }}>
        <div>
          <p>Error {statusCode}</p>
          <p>{error?.message}</p>
          <Link href="/">Go to Home</Link>
        </div>
      </div>
    </MainLayout>
  );
}

export default ErrorPage;
