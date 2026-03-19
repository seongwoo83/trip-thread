import { NavLink as RNavLink, useLocation } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import { Burger, Container, Drawer, Group } from "@mantine/core";

const NAV_LINKS = [{ label: "Home", href: "/" }];

export const Header = () => {
	const [opened, { toggle, close }] = useDisclosure(false);
	const { pathname } = useLocation();

	return (
		<div className="w-full h-full bg-white/70 backdrop-blur-md border-b border-gray-200/60">
			<Container size="xl" h="100%">
				<Group h="100%" justify="flex-start">
					{/* Logo */}
					<RNavLink to="/" className="no-underline">
						<span
							style={{
								fontFamily: "Paperozi",
								fontWeight: 700,
								fontSize: "1.125rem",
								letterSpacing: "-0.02em",
								color: "#111",
							}}
						>
							Trip
							<span style={{ color: "#6366f1" }}>·</span>
							Thread
						</span>
					</RNavLink>

					{/* Desktop nav */}
					<Group gap="xl" visibleFrom="sm" className="ml-6">
						{NAV_LINKS.map(({ label, href }) => {
							const isActive = pathname === href;
							return (
								<div key={href} className="relative flex items-center pb-0.5">
									<RNavLink
										to={href}
										className="no-underline"
										style={{
											fontSize: "0.875rem",
											fontWeight: isActive ? 600 : 400,
											color: isActive ? "#111" : "#6b7280",
											transition: "color 0.15s",
										}}
									>
										{label}
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
						{/* <Button
							visibleFrom="sm"
							variant="outline"
							size="sm"
							radius="xl"
							style={{
								borderColor: "#d1d5db",
								color: "#374151",
								fontWeight: 500,
							}}
						>
							Login
						</Button> */}
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
			>
				{/* <Stack>
					{NAV_LINKS.map(({ label, href }) => (
						<Button
							key={href}
							variant={pathname === href ? "light" : "subtle"}
							component={RNavLink}
							to={href}
							onClick={close}
							justify="flex-start"
							size="md"
						>
							{label}
						</Button>
					))}
					<Button mt="sm" radius="xl">
						Login
					</Button>
				</Stack> */}
			</Drawer>
		</div>
	);
};
