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
    userType enum('employer', 'employee'),
    active boolean not null default FALSE,
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
    companyName varchar(100) not null,
    phoneNumber varchar(30) not null,
    website varchar(100) not null,
    address char(36) not null,
    primary key (id),
    foreign key (id) references users(id),
    foreign key (address) references locations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table employees(
    id char(36) not null,
    firstName varchar(100) not null,
    lastName varchar(100) not null,
    phoneNumber varchar(30),
    birthday date not null,
    availableFrom date not null,
    availableTo date,
    hourlyRateFrom float,
    hourlyRateTo float,
    maximumCommute int,
    location char(36),
    ignoreDistance boolean not null default FALSE,
    bio varchar(200) not null,
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
    jobId char(36) not null,
    employer char(36) not null,
    role char(36) not null,
    jobTitle varchar(100) not null,
    hourlyRate float,
    startDate date,
    workLocation varchar(36) not null,
    description varchar(100),
    primary key (jobId),
    foreign key (employer) references employers(id),
    foreign key (role) references roles(id),
    foreign key (workLocation) references locations(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table interestedRoles(
    employee char(36) not null,
    roleId char(36) not null,
    primary key (employee, roleId),
    foreign key (employee) references employees(id),
    foreign key (roleId) references roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table jobInterest(
    jobId char(36) not null,
    employee char(36) not null,
    initiator enum('employer', 'employee'),
    status enum('available', 'liked', 'offered', 'done'),
    primary key (jobId, employee),
    foreign key (jobId) references jobs(jobId),
    foreign key (employee) references employees(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

create table notifications(
    id char(36) not null,
    receipent char(36) not null,
    job char(36) not null,
    employee char(36) not null,
    message varchar(200) not null,
    unread boolean not null default true,
    createdDate date not null,
    foreign key (job) references jobs(jobId),
    foreign key (employee) references employees(id),
    foreign key (receipent) references users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
