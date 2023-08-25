import React from "react"
import MainLayout from "../../../layout/MainLayout/MainLayout"
import { Paper, Input, Select, Button, useRouter } from "@ioncore/theme"
import BaseApi from "../../../Api/BaseApi";
import ServerApi from "../../../Api/ServerApi";
import { SelectInput } from "../../../components/SelectInput/SelectInput";
import Modal, { useModal } from "../../../components/Modal/Modal";
import IoncoreLoader from "../../../components/IoncoreLoader/IoncoreLoader";
import { ServerAttributes } from "@shared/models";
import UserApi from "../../../Api/UserApi";

export default function ServerCreatePage() {
  const user = BaseApi.getUser();
  const [versions] = ServerApi.useVersions();
  const [name, setName] = React.useState("");
  const [version, setVersion] = React.useState("latest");
  const [ram, setRam] = React.useState(1024);
  const [freeRam] = UserApi.useHasPermission("SERVER.RAM");
  const router = useRouter();

  const [createdServer, setCreatedServer] = React.useState<ServerAttributes | null>(null);

  const modal = useModal();
  const onSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    modal.open();
    setCreatedServer(null);
    ServerApi.createServer(name, version, ram).then(server => {
      setCreatedServer(server);
    });
  }, [user, name, version, ram]);


  return (
    <MainLayout>
      <Paper>
        <h2>Create a new server</h2>
        <form onSubmit={onSubmit}>
          <Input required value={name} onChange={e => setName(e.target.value)} label="Server name*" />
          <br />
          <sup>
            The server name is used to identify your server. This can be anything you want.
          </sup>
          <br />
          <Input min={256} max={freeRam ? (1024 * 16) : 1024} placeholder="1024" type="number" value={ram} onChange={e => setRam(e.target.valueAsNumber)} label={"Memory (MB)" + (freeRam ? "*" : " (Limited for non-admins)")} />
          <br />
          <sup>
            The amount of memory your server will have. The more memory, the better your server will perform.
          </sup>
          <br />
          <div style={{
            display: "inline-block",
            padding: 4,
            boxSizing: "border-box",
          }}>
            <label className="ic-Input-label">Version</label>
            {/* TODO: SelectInput doesn't change the value, fix this in @ioncore/theme */}
            <SelectInput value={version} onChange={v => setVersion(v)} options={["latest", ...(versions ?? [])]} />
          </div>
          <br />
          <Button variant="success" type="submit">Create</Button>
        </form>
      </Paper>

      <Modal onClose={modal.close} opened={modal.isOpen}>
        {createdServer ? (
          <>
            <h2>Server created</h2>
            <p>Your server has been created. You can now manage it from the <a href="/server">My servers</a> page.</p>
            <Button onClick={() => {
              modal.close();
              router.setPath(`/server/${createdServer.id}`);
            }}>Go to server</Button>
          </>
        ) : (
          <>
            <h2>Creating server...</h2>
            <p>Your server is being created. Please wait a moment.</p>
            <IoncoreLoader />
          </>
        )}
      </Modal>
    </MainLayout>
  );
}
