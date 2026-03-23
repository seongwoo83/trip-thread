import { NavLink as RNavLink, useLocation } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import {
	Burger,
	Button,
	Container,
	Drawer,
	Group,
	useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";

const NAV_LINKS = [{ labelKey: "Home", href: "/" }];

export const Header = () => {
	const [opened, { toggle, close }] = useDisclosure(false);
	const { pathname } = useLocation();
	const { i18n } = useTranslation();
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();

	const toggleLanguage = () => {
		i18n.changeLanguage(i18n.language === "ko" ? "en" : "ko");
	};

	return (
		<div className="w-full h-full bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200/60 dark:border-gray-700/60">
			<Container size="xl" h="100%">
				<Group h="100%" justify="flex-start">
					{/* Logo */}
					<RNavLink to="/" className="no-underline">
						<span
							className="text-gray-900 dark:text-gray-100"
							style={{
								fontFamily: "Paperozi",
								fontWeight: 700,
								fontSize: "1.125rem",
								letterSpacing: "-0.02em",
							}}
						>
							Trip
							<span style={{ color: "#6366f1" }}>·</span>
							Thread
						</span>
					</RNavLink>

					{/* Desktop nav */}
					<Group gap="xl" visibleFrom="sm" className="ml-6">
						{NAV_LINKS.map(({ labelKey, href }) => {
							const isActive = pathname === href;
							return (
								<div key={href} className="relative flex items-center pb-0.5">
									<RNavLink
										to={href}
										className="no-underline"
										style={{
											fontSize: "0.875rem",
											fontWeight: isActive ? 600 : 400,
											color: isActive
												? colorScheme === "dark"
													? "#f3f4f6"
													: "#111"
												: "#6b7280",
											transition: "color 0.15s",
										}}
									>
										{labelKey}
									</RNavLink>
									{isActive && (
										<span
											className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full"
											style={{ backgroundColor: "#6366f1" }}
										/>
									)}
								</div>
							);
						})}
					</Group>

					{/* Right actions */}
					<Group className="ml-auto">
						<Button
							variant="subtle"
							size="xs"
							color="gray"
							onClick={toggleColorScheme}
							style={{ minWidth: 36 }}
						>
							{colorScheme === "dark" ? "☀️" : "🌙"}
						</Button>
						<Button
							variant="subtle"
							size="xs"
							color="gray"
							onClick={toggleLanguage}
							style={{ fontFamily: "monospace", minWidth: 36 }}
						>
							{i18n.language === "ko" ? "EN" : "한"}
						</Button>
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom="sm"
							size="sm"
							aria-label="Toggle navigation"
						/>
					</Group>
				</Group>
			</Container>

			{/* Mobile Drawer */}
			<Drawer
				opened={opened}
				onClose={close}
				title={
					<span
						style={{
							fontFamily: "Paperozi",
							fontWeight: 700,
							fontSize: "1.125rem",
							letterSpacing: "-0.02em",
						}}
					>
						trip<span style={{ color: "#6366f1" }}>·</span>thread
					</span>
				}
				size="xs"
			></Drawer>
		</div>
	);
};
