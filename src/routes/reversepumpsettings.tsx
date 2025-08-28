import { createFileRoute, redirect } from "@tanstack/react-router";
import useAuthStore from "../store/authStore";
import ReversePumping from "../pages/AdvancedMode/PumpsPage/components/reversePumping";

export const Route = createFileRoute("/reversepumpsettings")({
  component: ReversePumping,
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({ to: "/login" });
    }
  },
});


