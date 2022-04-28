import { notification } from "antd";
import { IconType } from "antd/lib/notification";
import { ReactNode } from "react";

export function notify({
  type,
  message,
  description,
}: {
  type?: IconType
  message: ReactNode
  description?: ReactNode
}) {
  notification.open({
    type,
    message,
    description: description,
    placement:"bottomLeft",
  });
}
