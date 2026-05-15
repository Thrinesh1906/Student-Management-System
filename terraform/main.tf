terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "vpc" {
  source = "./modules/vpc"
  name   = var.project_name
  cidr   = var.vpc_cidr
  azs    = var.availability_zones
}

module "eks" {
  source             = "./modules/eks"
  cluster_name       = var.project_name
  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_type = var.node_instance_type
  desired_capacity   = var.desired_capacity
  min_capacity       = var.min_capacity
  max_capacity       = var.max_capacity
}

module "alb" {
  source            = "./modules/alb"
  name              = var.project_name
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "alb_dns_name" {
  value = module.alb.dns_name
}
