drop database if exists recruiter;
create database recruiter;
use recruiter;

create table users(
    id char(36) not null,
    email varchar(320) not null,
    password binary(64) not null,
    salt binary(128) not null,
    customerId varchar(30),
    subscriptionId varchar(30),
    userType enum('employer', 'employee') not null,
    active boolean not null default false,
    resetCode char(6) not null default "000000",
    primary key (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table locations(
    id char(36) not null,
    address varchar(100) not null,
    longitude decimal(18,12) not null,
    latitude decimal(18,12) not null,
    primary key (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table employers(
    id char(36) not null,
    firstName varchar(100) not null,
    lastName varchar(100) not null,
    companyName varchar(100) not null,
    companyNumber varchar(100) not null,
    landline varchar(30),
    mobile varchar(30),
    website varchar(100),
    pushNotification boolean not null default true,
    primary key (id),
    foreign key (id) references users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table employees(
    id char(36) not null,
    firstName varchar(100) not null,
    lastName varchar(100) not null,
    phoneNumber varchar(30) not null,
    birthday date not null,
    availableFrom date not null,
    availableTo date,
    payRateFrom float not null,
    payRateTo float,
    maximumCommute int not null,
    location char(36) not null,
    ignoreDistance boolean not null default false,
    bio varchar(200),
    experience varchar(100),
    available boolean not null default true,
    pushNotification boolean not null default true,
    primary key (id),
    foreign key (id) references users(id),
    foreign key (location) references locations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table industries(
    id char(36) not null,
    industry varchar(100) not null,
    description varchar(100) not null,
    primary key (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table roles(
    id char(36) not null,
    roleName varchar(100) not null unique,
    industry char(36) not null,
    description varchar(100) not null,
    primary key (id),
    foreign key (industry) references industries(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table jobs(
    id char(36) not null,
    employer char(36) not null,
    role char(36) not null,
    contactName char(100),
    contactNumber char(30),
    contactEmail char(100),
    jobTitle varchar(200) not null,
    payRate float not null,
    startDate date not null,
    endDate date,
    workLocation varchar(36) not null,
    description varchar(100),
    bonus boolean not null default false,
    accomodation boolean not null default false,
    active boolean not null default true,
    primary key (id),
    foreign key (employer) references employers(id),
    foreign key (role) references roles(id),
    foreign key (workLocation) references locations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table interestedRoles(
    employee char(36) not null,
    roleId char(36) not null,
    primary key (employee, roleId),
    unique (employee, roleId),
    foreign key (employee) references employees(id),
    foreign key (roleId) references roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table jobInterest(
    job char(36) not null,
    employee char(36) not null,
    initiator enum('employer', 'employee') not null,
    status enum('available', 'liked', 'offered', 'done') not null,
    primary key (job, employee),
    unique (job, employee),
    foreign key (job) references jobs(id),
    foreign key (employee) references employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table employeeSnapshot select * from employees limit 0;
alter table employeeSnapshot add foreign key (id) references employees(id);

create table jobSnapshot select * from jobs limit 0;
alter table jobSnapshot add foreign key (id) references jobs(id);

create table notifications(
    id char(36) not null,
    receipent char(36) not null,
    job char(36) not null,
    employee char(36) not null,
    message varchar(200) not null,
    unread boolean not null default true,
    createdDate date not null,
    modifiedDate date not null,
    employeeSnapshot char(36) not null,
    jobSnapshot char(36) not null,
    foreign key (job) references jobs(id),
    foreign key (employee) references employees(id),
    foreign key (receipent) references users(id),
    foreign key (employeeSnapshot) references employeeSnapshot(id),
    foreign key (jobSnapshot) references jobSnapshot(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
