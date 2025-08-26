import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
	children: React.ReactNode;
}

const Layout: React.FC<MainLayoutProps> = ({ children }) => {
	const [collapsed, setCollapsed] = useState(false);

	// Pass the collapsed state to children
	const childrenWithProps = React.Children.map(children, (child) => {
		if (React.isValidElement(child)) {
			return React.cloneElement(child, { sidebarCollapsed: collapsed });
		}
		return child;
	});

	return (
		<div className="min-h-screen bg-base-200">
			<HeaderBar
				collapsed={collapsed}
				onToggle={() => setCollapsed(!collapsed)}
			/>
			<Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
			<main
				className={`transition-all duration-300 min-h-screen ${
					collapsed ? "ml-0" : "ml-72"
				}`}
			>
				<div className="p-6 pt-24">{childrenWithProps}</div>
			</main>
		</div>
	);
};

export default Layout;
