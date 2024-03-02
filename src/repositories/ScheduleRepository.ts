import { Schedule } from "../models/Schedule";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { firestore } from "../firebase";

export interface ScheduleRepository {
  getAllSchedules(): Promise<Schedule[]>;
  getSchedules(filter: (schedule: Schedule) => boolean): Promise<Schedule[]>;
  syncRemote(): Promise<void>;
  saveSchedule(schedule: Schedule): Promise<void>;
  deleteSchedule(scheduleID: string): Promise<void>;
}

class DefaultScheduleRepository implements ScheduleRepository {
  cachedSchedule = new Map<string, Schedule>();
  scheduleKey = "Schedule";

  async getAllSchedules(): Promise<Schedule[]> {
    let schedules: Schedule[] = [];
    for (let [_, schedule] of this.cachedSchedule.entries()) {
      schedules.push(schedule);
    }
    return schedules;
  }

  async getSchedules(filter: (schedule: Schedule) => boolean): Promise<Schedule[]> {
    let schedules: Schedule[] = [];
    for (let [_, schedule] of this.cachedSchedule.entries()) {
      if (filter(schedule)) {
        schedules.push(schedule);
      }
    }
    return schedules;
  }

  async syncRemote(): Promise<void> {
    const snapshot = await getDocs(collection(firestore, this.scheduleKey));
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const schedule = {
        id: doc.id,
        guildID: data.guildID,
        channelID: data.channelID,
        title: data.title,
        content: data.content,
        year: data.year,
        month: data.month,
        day: data.day,
        hour: data.hour,
        minute: data.minute,
        userIDs: data.userIDs,
        isOnReminder: data.isOnReminder,
        isRepeat: data.isRepeat,
        repeatPattern: data.repeatPattern
      };
      this.cachedSchedule.clear();
      this.cachedSchedule.set(doc.id, schedule);
    });
  }

  async saveSchedule(schedule: Schedule): Promise<void> {
    await setDoc(doc(firestore, this.scheduleKey, schedule.id), {
      ...schedule
    });
    this.cachedSchedule.set(schedule.id, schedule);
    return;
  }

  async deleteSchedule(scheduleID: string): Promise<void> {
    await deleteDoc(doc(firestore, this.scheduleKey, scheduleID));
    this.cachedSchedule.delete(scheduleID);
  }
}

export const scheduleRepository: ScheduleRepository = new DefaultScheduleRepository();
