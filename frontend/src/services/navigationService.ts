import type { NavigateFunction } from 'react-router-dom';

let navigateFunction: NavigateFunction | null = null;

export const setNavigate = (navigate: NavigateFunction): void => {
	navigateFunction = navigate;
};

export const navigateTo = (path: string): void => {
	if (navigateFunction) {
		navigateFunction(path);
	} else {
		// Fallback if navigate is not set (should not happen in normal flow)
		window.location.href = path;
	}
};
