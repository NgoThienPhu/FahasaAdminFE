import type BaseEntity from './BaseEntity'

export interface UserAdmin extends BaseEntity {
    username: string;
    fullName: string;
    email: {
      email: string;
      isVerify: boolean;
    }
  }

 export interface UserMember extends UserAdmin {
    phoneNumber: {
        phoneNumber: string;
        isVerify: boolean;
    }
    gender: "MALE" | "FEMALE" | "OTHER";
    dateOfBirth: string | null;
    isActived: boolean;
}
