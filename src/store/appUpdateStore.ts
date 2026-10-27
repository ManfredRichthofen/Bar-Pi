import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UpdateChannel } from '@/components/updates/UpdateSettings';

interface AppUpdateState {
  channel: UpdateChannel;
  autoCheck: boolean;
  setChannel: (channel: UpdateChannel) => void;
  setAutoCheck: (autoCheck: boolean) => void;
}

const useAppUpdateStore = create<AppUpdateState>()(
  persist(
    (set) => ({
      channel: 'release',
      autoCheck: true,
      setChannel: (channel) => set({ channel }),
      setAutoCheck: (autoCheck) => set({ autoCheck }),
    }),
    {
      name: 'app-update-storage',
    },
  ),
);

export default useAppUpdateStore;
