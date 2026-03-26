# Unregistered Teams — Action Required

> **Status:** Pending registration
> **Action:** Register these 3 teams via `/admin/register` before event day

---

## Teams to Register

### 1. Scuffed Engineering (Hardware)
- **Lead:** Sameer Guruprasad Belthur
- **Phone:** 918197170918
- **Email:** sameer.guruprasad@outlook.com
- **College:** Jyothy Institute of Technology, Bengaluru, Karnataka
- **Members:** 4
- **Judge Assignment (reserved):** Harish + Swaroop

### 2. Tesla Core (Hardware)
- **Lead:** Saquib Pasha
- **Phone:** 919916137866
- **Email:** saquibpashaee@gmail.com
- **College:** BMS Institute of Technology, Bangalore, Karnataka
- **Members:** 4
- **Judge Assignment (reserved):** Harish + Neeraj

### 3. Mavericks (Software)
- **Lead:** Vaibhav Pandey
- **Phone:** —
- **Email:** —
- **College:** —
- **Members:** —
- **Judge Assignment (reserved):** Swaroop + Santosh

---

## How to Register

1. Go to `/admin/register`
2. Set email and password for each team
3. Click **Register** — team gets created as APPROVED with stall number + QR code
4. Copy credentials and share with the team lead
5. After registering, manually add judge assignments via `/admin/judges` or run:

```
-- After registering, add these assignments to the DB:
-- Scuffed Engineering → Harish (slot 24) + Swaroop (slot 24)
-- Tesla Core → Harish (slot 25) + Neeraj (slot 25)
-- Mavericks → Swaroop (slot 25) + Santosh (slot 25)
```

## After Registration — Final Judge Load

| Judge | Current | + New | Final |
|-------|---------|-------|-------|
| Harish (HW) | 23 | +Scuffed Eng, +Tesla Core | **25** |
| Swaroop (SW) | 23 | +Scuffed Eng, +Mavericks | **25** |
| Neeraj (SW) | 24 | +Tesla Core | **25** |
| Santosh (SW) | 24 | +Mavericks | **25** |
