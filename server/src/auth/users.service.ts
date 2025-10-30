import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(name: string, email: string, password: string, phone?: string) {
    const exists = await this.userModel.exists({ email: email.toLowerCase() });
    if (exists) throw new ConflictException('Email ya registrado');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone,
      emailVerified: false,
      phoneVerified: false,
    });
    return this.sanitize(user);
  }

  sanitize(u: UserDocument | (User & { _id: any })) {
    const obj = (u as any).toObject ? (u as any).toObject() : (u as any);
    const { _id, passwordHash, __v, ...rest } = obj;
    const id = (_id ?? obj.id)?.toString?.() ?? (_id ?? obj.id);
    return { id, ...rest } as any;
  }

  async findByEmail(email: string) {
    const u = await this.userModel.findOne({ email: email.toLowerCase() });
    return u ? this.sanitize(u) : null;
  }

  async getInternalByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string) {
    const u = await this.userModel.findById(id);
    return u ? this.sanitize(u) : null;
  }

  async getInternalById(id: string) {
    return this.userModel.findById(id);
  }

  async updatePasswordById(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userModel.updateOne({ _id: id }, { passwordHash });
    return true;
  }

  async validatePassword(email: string, password: string) {
    const u = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!u) return null;
    const ok = await bcrypt.compare(password, u.passwordHash);
    return ok ? this.sanitize(u) : null;
  }

  async setEmailVerification(userId: string, token: string, expires: Date) {
    await this.userModel.updateOne({ _id: userId }, { emailVerifyToken: token, emailVerifyExpires: expires });
  }

  async verifyEmail(token: string) {
    const u = await this.userModel.findOne({ emailVerifyToken: token });
    if (!u) return false;
    if (u.emailVerifyExpires && u.emailVerifyExpires.getTime() < Date.now()) return false;
    u.emailVerified = true;
    u.emailVerifyToken = undefined;
    u.emailVerifyExpires = undefined as any;
    await u.save();
    return true;
  }

  async setPhoneVerification(userId: string, code: string, expires: Date) {
    await this.userModel.updateOne({ _id: userId }, { phoneVerifyCode: code, phoneVerifyExpires: expires });
  }

  async verifyPhone(email: string, code: string) {
    const u = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!u) return false;
    if (!u.phoneVerifyCode || !u.phoneVerifyExpires) return false;
    if (u.phoneVerifyCode !== code) return false;
    if (u.phoneVerifyExpires.getTime() < Date.now()) return false;
    u.phoneVerified = true;
    u.phoneVerifyCode = undefined;
    u.phoneVerifyExpires = undefined as any;
    await u.save();
    return true;
  }

  async statusByEmail(email: string) {
    const u = await this.userModel.findOne({ email: email.toLowerCase() });
    return u ? this.sanitize(u) : null;
  }

  // Utilidad de depuración para verificar el estado de un token de verificación de email
  async debugVerifyEmailToken(token: string) {
    const u = await this.userModel.findOne({ emailVerifyToken: token });
    if (!u) return { exists: false } as const;
    const expiresAt = u.emailVerifyExpires ? u.emailVerifyExpires.getTime() : 0;
    const now = Date.now();
    const expired = !!expiresAt && expiresAt < now;
    return {
      exists: true as const,
      expired,
      expiresAt,
      now,
      email: u.email,
    };
  }
}
