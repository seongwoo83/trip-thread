import { NavLink as RNavLink, useLocation } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import {
	Anchor,
	Burger,
	Button,
	Container,
	Drawer,
	Group,
	Stack,
	Text,
} from "@mantine/core";

const NAV_LINKS = [
	{ label: "Home", href: "/" },
	{ label: "Trip", href: "/trip" },
];

export const Header = () => {
	const [opened, { toggle, close }] = useDisclosure(false);
	const { pathname } = useLocation();

	return (
		<>
			<Container size="xl" h="100%">
				<Group h="100%" justify="flex-start">
					{/* Logo */}
					<Anchor component={RNavLink} to="/" underline="never">
						<Text fw={700} size="lg" c="dark">
							Trip-Thread
						</Text>
					</Anchor>

					{/* Desktop nav */}
					<Group gap="lg" visibleFrom="sm" className="ml-5">
						{NAV_LINKS.map(({ label, href }) => (
							<Anchor
								key={href}
								component={RNavLink}
								to={href}
								underline="never"
								c={pathname === href ? "blue" : "dark"}
								fw={pathname === href ? 600 : 400}
							>
								{label}
							</Anchor>
						))}
					</Group>

					{/* Right actions */}
					<Group className="ml-auto">
						<Button variant="subtle" size="sm" visibleFrom="sm">
							Login
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
					<Text fw={700} size="lg">
						trip-thread
					</Text>
				}
				size="xs"
			>
				<Stack>
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
					<Button mt="sm">Login</Button>
				</Stack>
			</Drawer>
		</>
	);
};
