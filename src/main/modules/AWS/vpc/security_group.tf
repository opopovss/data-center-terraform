resource aws_security_group vpc {
  name_prefix = var.vpc_name
  description = "VPC security group."
  vpc_id = module.vpc.vpc_id

  tags = merge(
  var.required_tags,
  {
    "Name" = "${var.vpc_name}-vpc_bamboo"
  },
  )
}