import type { BrowserWindow, IpcMain, IpcMainEvent } from 'electron'

export function connectOAuth2Window(
  parent: BrowserWindow,
  child: BrowserWindow,
  requestID: string,
  ipc: IpcMain
): void {
  const onCloseRequest = (event: IpcMainEvent, id: string): void => {
    if (event.sender === parent.webContents && id === requestID && !child.isDestroyed()) {
      child.close()
    }
  }
  const onNavigation = (_event: unknown, url: string): void => {
    if (!parent.webContents.isDestroyed()) {
      parent.webContents.send('oauth2-navigate', requestID, url)
    }
  }
  const onParentClosed = (): void => {
    if (!child.isDestroyed()) {
      child.close()
    }
  }
  child.once('closed', () => {
    ipc.removeListener('oauth2-close', onCloseRequest)
    child.webContents.removeListener('did-navigate', onNavigation)
    parent.removeListener('closed', onParentClosed)
    if (!parent.webContents.isDestroyed()) {
      parent.webContents.send('oauth2-close', requestID)
    }
  })
  ipc.on('oauth2-close', onCloseRequest)
  child.webContents.on('did-navigate', onNavigation)
  parent.once('closed', onParentClosed)
}
