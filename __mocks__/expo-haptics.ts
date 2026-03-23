export const impactAsync = jest.fn();
export const notificationAsync = jest.fn();
export const selectionAsync = jest.fn();
export const ImpactFeedbackStyle = { Light: 'Light', Medium: 'Medium', Heavy: 'Heavy' };
export const NotificationFeedbackType = { Success: 'Success', Warning: 'Warning', Error: 'Error' };
export default { impactAsync, notificationAsync, selectionAsync };
