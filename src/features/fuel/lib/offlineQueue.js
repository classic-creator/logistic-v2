const OFFLINE_QUEUE_KEY = 'ltms_fuel_offline_queue';

export const readOfflineFuelQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
};

export const writeOfflineFuelQueue = (queue) => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
};

export const clearOfflineFuelQueue = () => {
  localStorage.setItem(OFFLINE_QUEUE_KEY, '[]');
};
