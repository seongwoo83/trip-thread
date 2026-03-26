import { NavLink as RNavLink, useLocation } from "react-router-dom";
import { useDisclosure } from "@mantine/hooks";
import {
	Burger,
	Container,
	Drawer,
	Group,
	UnstyledButton,
	useMantineColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import styles from "./Header.module.scss";

const NAV_LINKS = [{ labelKey: "Home", href: "/" }];

export const Header = () => {
	const [opened, { toggle, close }] = useDisclosure(false);
	const { pathname } = useLocation();
	const { i18n } = useTranslation();
	const { colorScheme, toggleColorScheme } = useMantineColorScheme();
	const dark = colorScheme === "dark";

	const toggleLanguage = () => {
		i18n.changeLanguage(i18n.language === "ko" ? "en" : "ko");
	};

	return (
		<div className={styles.shell}>
			<Container size="md" h="100%">
				<Group h="100%" justify="space-between">
					<RNavLink to="/" className={styles.brand}>
						<svg className={styles.brandIcon} viewBox="0 0 24 24" fill="none">
							<circle
								className={styles.brandCircle}
								cx="12"
								cy="12"
								r="10"
								strokeWidth="1.5"
							/>
							<path
								className={styles.brandNeedle}
								d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"
							/>
							<circle className={styles.brandCore} cx="12" cy="12" r="1.5" />
						</svg>
						<span className={styles.brandText}>
							trip
							<span className={styles.brandAccent}>thread</span>
						</span>
					</RNavLink>

					<Group gap="lg" visibleFrom="sm">
						{NAV_LINKS.map(({ labelKey, href }) => {
							const isActive = pathname === href;
							return (
								<RNavLink
									key={href}
									to={href}
									className={styles.navLink}
									data-active={isActive}
								>
									{labelKey}
									{isActive && <span className={styles.navIndicator} />}
								</RNavLink>
							);
						})}
					</Group>

					<Group gap={4}>
						<UnstyledButton
							onClick={toggleColorScheme}
							className={styles.actionButton}
						>
							<span>{dark ? "☀️" : "🌙"}</span>
						</UnstyledButton>
						<UnstyledButton
							onClick={toggleLanguage}
							className={`${styles.actionButton} ${styles.languageButton}`}
						>
							{i18n.language === "ko" ? "EN" : "한"}
						</UnstyledButton>
						<Burger
							opened={opened}
							onClick={toggle}
							hiddenFrom="sm"
							size="sm"
							color={dark ? "#87eaf2" : "#0e7c86"}
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
					<span className={styles.drawerTitle}>
						trip
						<span className={styles.drawerAccent}>thread</span>
					</span>
				}
				size="xs"
			/>
		</div>
	);
};
