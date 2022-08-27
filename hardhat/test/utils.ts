import { ScheduleTheRandomness } from '../typechain-types';

export const getValues = async (
  scheduleTheRandomness: ScheduleTheRandomness
) => {
  let getPromises = [];
  for (let i = 1; i <= 20; i++) {
    let pro = scheduleTheRandomness.components(i);
    getPromises.push(pro);
  }
  const values = await Promise.all(getPromises);

  return values;
};
