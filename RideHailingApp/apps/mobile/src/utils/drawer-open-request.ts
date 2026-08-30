// Lets a screen outside the sidebar's own navigation tree (e.g. active-ride.tsx, a focused
// mid-ride screen reached via a separate Stack push -- see (drawer)/_layout.tsx's header comment
// for why `DrawerActions.openDrawer()` can't reach the Drawer directly from there) ask the sidebar
// to open itself once navigation lands back on a screen that IS inside the Drawer's tree.
//
// A plain module-level flag is enough for this: it's a single boolean signal for a UI shell with
// no backend, not state that needs to be reactive or persisted -- same pattern as
// registration-draft.ts. dashboard.tsx (the screen every such "menu" tap returns to) checks and
// clears this flag on focus via `consumeDrawerOpenRequest`.
export const drawerOpenRequest = { pending: false };

export function requestDrawerOpen() {
  drawerOpenRequest.pending = true;
}

export function consumeDrawerOpenRequest(): boolean {
  if (!drawerOpenRequest.pending) return false;
  drawerOpenRequest.pending = false;
  return true;
}
