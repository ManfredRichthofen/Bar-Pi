// Test file to verify store functionality
import useConfigStore from './store/configStore';
import useAuthStore from './store/authStore';

// Test that stores are properly typed and accessible
const testStores = () => {
  const configStore = useConfigStore.getState();
  const authStore = useAuthStore.getState();

  console.log('Config store:', configStore);
  console.log('Auth store:', authStore);

  return { configStore, authStore };
};

export default testStores;
