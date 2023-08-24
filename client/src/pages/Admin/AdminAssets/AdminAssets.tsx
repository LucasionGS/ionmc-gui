import { Button, Checkbox, CheckboxGroup, Input, Paper, Select } from "@ioncore/theme"
import { ClientUser, RoleAttributes, RoleAttributesObject, AssetAttributes } from "@shared/models";
import React from "react"
import AssetApi from "../../../Api/AssetApi";
import { IconEdit, IconEye, IconTrash } from "@tabler/icons-react";
// import Modal, { useModal } from "../../../components/Modal/Modal"
import { Modal, useModal, useManagedModal } from "@ioncore/theme/index"
import "./AdminAssets.scss"

export default function AdminAssets() {
  const [assets, updateAssets] = AssetApi.useAssets();
  const [selectedAssets, setSelectedAssets] = React.useState<AssetAttributes[]>([]);
  const [_updateI, _update] = React.useState(0);
  const forceUpdate = () => _update(_updateI + 1);

  // const { isOpen: isOpenDeleteMultiple, open: openDeleteMultiple, close: closeDeleteMultiple } = useModal();
  const deleteMultiple = useManagedModal();

  return (
    <Paper>
      <h1>Asset Manager</h1>
      <p>
        Here you can manage all assets that are available to the system.
      </p>
      <Button
        variant="primary"
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.multiple = true;
          input.onchange = () => {
            const files = input.files || [];
            Promise.all(Array.from(files).map(async file => AssetApi.upload(file))).then(updateAssets);
          }
          input.click();
        }}
      >Upload Asset</Button>
      {selectedAssets.length > 0 && (
        <Button
          variant="danger"
          onClick={() => {
            deleteMultiple.open();
          }}
        >Delete {selectedAssets.length} Assets</Button>
      )}
      <div className="admin-asset-block-container">
        {assets?.map(asset => (
          <AssetItem
            key={asset.id}
            asset={asset}
            selectedAssets={selectedAssets}
            onEditFinished={() => {
              updateAssets();
            }}
            onSelectChange={(checked) => {
              if (checked) {
                setSelectedAssets([...selectedAssets, asset]);
              }
              else {
                setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
              }
            }}
          />
        ))}
      </div>
      <deleteMultiple.Modal closeOnOutsideClick>
        <h1>Delete {selectedAssets.length} assets?</h1>
        <p>This cannot be undone.</p>
        <Button variant="danger" onClick={async () => {
          await Promise.all(selectedAssets.map(async a => {
            await AssetApi.deleteAsset(a.id);
          }));
          updateAssets();
          deleteMultiple.close();
          setSelectedAssets([]);
        }}>Delete</Button>
        <Button onClick={() => {
          deleteMultiple.close();
        }}>Cancel</Button>
      </deleteMultiple.Modal>
    </Paper>
  )
}

function AssetItem({ asset, selectedAssets, onEditFinished, onSelectChange }: { asset: AssetAttributes, selectedAssets: AssetAttributes[], onEditFinished?: () => void, onSelectChange?: (checked: boolean) => void }) {
  // const { isOpen: isOpenView, open: openView, close: closeView } = useModal();
  const view = useManagedModal();
  // const { isOpen: isOpenDelete, open: openDelete, close: closeDelete } = useModal();
  const del = useManagedModal();

  const selected = React.useMemo(() => {
    return selectedAssets.find(a => a.id === asset.id) !== undefined;
  }, [asset, selectedAssets.length]);

  const url = `${window.location.protocol}//${window.location.host}/api/asset/view/${asset.name}`;
  return (
    <>
      <div className="admin-asset-block">
        {asset.name ? (
          <img
            onClick={(e) => {
              if (e.ctrlKey) {
                onSelectChange?.(!selected);
              } else if (e.shiftKey) {
                // Open new tab
                window.open(url, "_blank");
              }
              else view.open();
            }}
            src={url}
            alt={asset.name}
          />
        ) : "<No preview>"}
        <div className="admin-asset-block-actions">
          <Checkbox checked={selected} onChange={(c) => onSelectChange?.(c)} />
        </div>
      </div>
      <view.Modal closeOnOutsideClick>
        <p>{asset.name}</p>
        <Button variant="success" onClick={() => {
          view.close();
        }}>Done</Button>
        <Button variant="danger" onClick={del.open}>Delete</Button>
      </view.Modal>
      <del.Modal closeOnOutsideClick>
        <h1>Delete {asset.name}?</h1>
        <p>This cannot be undone.</p>
        <Button variant="danger" onClick={() => {
          AssetApi.deleteAsset(asset.id).then(() => {
            del.close();
            onEditFinished?.();
          });
        }}>Delete</Button>
        <Button onClick={() => {
          del.close();
        }}>Cancel</Button>
      </del.Modal>
    </>
  );
}